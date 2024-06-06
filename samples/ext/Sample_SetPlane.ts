import {
    Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext,
    HoverCameraController, Object3D, DirectLight, KelvinUtil,
    MeshRenderer,
    Object3DUtil,
    Plane3D,
    Vector3,
    PointerEvent3D,
    PostProcessingComponent,
    ColliderComponent,
    Matrix4,
    Quaternion,
    ComponentBase,
    Time,
    clamp,
    GeometryBase,
    LitMaterial,
    Color,
    UnLitMaterial,
    ToothMaterial,
} from "@orillusion/core";

import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { setFrameDelay, setTimeDelay } from "../../src/util/DelayUtil";
import { CCLQueryPost } from "./ccl/CCLQueryPost";

class LerpData {
    quat: Quaternion = new Quaternion();
    y: number = 0;
}

class SetPlaneAnimation extends ComponentBase {

    private _current = new LerpData()
    private _target = new LerpData()
    private _lerp = new LerpData();

    private _remain: number = 0;
    private _during: number = 0;
    private _isBottom: boolean;
    public playAnimation(pos: Vector3, normal: Vector3, during: number, isBottom?: boolean) {
        this._isBottom = isBottom;
        //计算所需要的旋转
        let matrix = Matrix4.helpMatrix.transformDir(normal, this._isBottom ? Vector3.DOWN : Vector3.UP);
        let rotateQuat = new Quaternion();
        rotateQuat.fromMatrix(matrix);

        this._current.quat.copyFrom(this.transform.localRotQuat);
        this._target.quat.multiply(rotateQuat, this._current.quat);
        this._remain = this._during = during;

        this._current.y = this.transform.y;
        this._target.y = -this.calcDeltaTransition(this.object3D, pos, this._target.quat);
    }

    private localPos: Vector3;
    private invMtrx: Matrix4;
    private calcDeltaTransition(obj: Object3D, pos: Vector3, targetQuation: Quaternion) {
        this.invMtrx ||= new Matrix4();
        this.localPos ||= new Vector3();
        this.invMtrx.copyFrom(obj.transform.worldMatrix).invert();
        this.invMtrx.transformPoint(pos, this.localPos);

        targetQuation.transformVector(this.localPos, this.localPos);
        return this.localPos.y;
    }

    public onUpdate(view?: View3D) {
        this._remain -= Time.delta;
        let t = this.getProgress();

        this._lerp.quat.lerp(this._current.quat, this._target.quat, t);
        this.object3D.localQuaternion = this._lerp.quat;

        this._lerp.y = this._current.y * (1 - t) + this._target.y * t;
        this.transform.y = this._lerp.y;

        if (this._remain <= 0) {
            this.object3D.removeComponent(SetPlaneAnimation);
        }
    }

    private getProgress() {
        let t = 1 - clamp(this._remain / this._during, 0, 1);
        t = t * 0.5 * Math.PI;
        t = Math.sin(t);
        return t;
    }
}

class Sample_SetPlane {
    view: View3D;
    scene: Scene3D;
    private plane = new Plane3D();
    private isBottomPlane: boolean = true;
    private cclPost: CCLQueryPost;
    private postProcessing: PostProcessingComponent;
    private cclColor: Color = new Color(0.6, 0.2, 0.2, 0.8);
    async run() {
        GUIHelp.init();

        Engine3D.setting.shadow.shadowSize = 2048
        Engine3D.setting.shadow.shadowBound = 100;
        Engine3D.setting.pick.enable = true;
        Engine3D.setting.pick.mode = `pixel`;

        await Engine3D.init({ renderLoop: () => { this.loop() } });

        this.scene = new Scene3D();
        let sky = this.scene.addComponent(AtmosphericComponent);
        sky.sunY = 0.6;

        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
        mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(30, -15, 10);

        this.initScene();
        sky.relativeTransform = this.lightObj.transform;

        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = mainCamera;
        Engine3D.startRenderView(this.view);

        this.postProcessing = this.scene.getOrAddComponent(PostProcessingComponent);

        //确定要退出选择平面功能，可以移除Post，否则只需要将 cclPost.activePost设置为false即可。
        GUIHelp.addButton('Remove Post', () => {
            if (this.cclPost) {
                this.postProcessing.removePost(CCLQueryPost);
                this.cclPost = null;
            }
        });

        GUIHelp.addColor(this, 'cclColor').onChange(v => {
            if (this.cclPost) {
                this.cclPost.selectPlaneColor.copyFrom(this.cclColor);
            }
        })

        let car = await Engine3D.res.loadGltf('gltfs/glb/PotionBottle.glb');

        let geometry = car.getComponents(MeshRenderer)[0].geometry;
        let model = this.initToothModel(geometry);
        this.scene.addChild(model);

        this.registerEvents();
    }

    private getCCLPost() {
        if (!this.cclPost) {
            this.cclPost = this.postProcessing.addPost(CCLQueryPost);
            this.cclPost.activePost = true;
            this.cclPost.selectPlaneColor.copyFrom(this.cclColor);
        }
        return this.cclPost;
    }

    private initToothModel(geometry: GeometryBase) {
        let cube = new Object3D();

        let meshRenderer = cube.addComponent(MeshRenderer);
        cube.addComponent(ColliderComponent);

        meshRenderer.geometry = geometry;
        let material = new ToothMaterial();

        meshRenderer.material = material;

        GUIHelp.add(this, 'isBottomPlane');

        return cube;
    }

    private registerEvents() {
        let pickFire = this.scene.view.pickFire;
        this.scene.view.enablePick = true;
        pickFire.addEventListener(PointerEvent3D.PICK_CLICK, this.onMousePick, this);
    }

    private async onMousePick(e: PointerEvent3D) {
        let obj = e.data.pick?.object3D;
        if (obj == null) return;
        let animation = obj.getComponent(SetPlaneAnimation);
        if (animation) return;
        let info = e.data.pickInfo;
        if (!this.cclPost) {
            this.cclPost = this.getCCLPost();
            //等待一段时间，否则在刚创建完post后，第一时间内，click的数据是之前取出来的buffer数据。
            //导致点击效果看不到
            await setTimeDelay(100);
        }
        this.cclPost.activePost = true;
        this.displaySelectArea(info);
        //等待一帧，供渲染
        await setFrameDelay(1);
        //暂停引擎，否则cclPost卡顿导致应用不流畅
        Engine3D.pause();
        //等待200ms后，恢复渲染，并且将cclPost设置为失效状态（下次点击会再次恢复一下），相比重新构建一个post要优雅一些。
        await setTimeDelay(200);
        this.cclPost.setPickData(null);
        this.cclPost.activePost = false;
        Engine3D.resume();
        //等待恢复渲染完毕的一帧之后，播放动画
        await setFrameDelay(1);

        //应用之前的点击结果播放动画
        let { worldPos, worldNormal, meshID, coord } = info;
        let component = obj.addComponent(SetPlaneAnimation);
        component.playAnimation(worldPos, worldNormal, 500, this.isBottomPlane);
        this.cclPost.setPickData(null);
    }

    private displaySelectArea(info) {
        let { worldPos, worldNormal, meshID, coord } = info;
        this.plane.fromNormalAndPoint(worldNormal, worldPos);
        this.plane.d *= -1;
        this.cclPost.setPickData(this.plane, coord.x, coord.y, meshID);
    }


    lightObj: Object3D;
    async initScene() {
        this.lightObj = new Object3D();
        this.lightObj.rotationX = 35;
        this.lightObj.rotationY = 110;
        this.lightObj.rotationZ = 0;
        let lc = this.lightObj.addComponent(DirectLight);
        lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        lc.castShadow = true;
        lc.intensity = 20;
        lc.indirect = 1
        this.scene.addChild(this.lightObj);
        GUIUtil.renderDirLight(lc, false);

        // this.scene.addChild(Object3DUtil.GetSingleCube(400, 0.1, 400, 0.2, 0.2, 0.2))
    }

    loop() {

    }
}

new Sample_SetPlane().run();