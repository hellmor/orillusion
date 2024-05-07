import {
    Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext,
    HoverCameraController, Object3D, DirectLight, KelvinUtil,
    MeshRenderer,
    Object3DUtil,
    BoxGeometry,
    Plane3D,
    Vector3,
    PointerEvent3D,
    PostProcessingComponent,
    GTAOPost,
    ColliderComponent,
    Matrix4,
    Quaternion,
    ComponentBase,
    Time,
    clamp,
    Res,
    GeometryBase,
    CCLQueryPost,
    LitMaterial,
} from "@orillusion/core";

import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";

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

        let postProcessing = this.scene.getOrAddComponent(PostProcessingComponent);
        this.cclPost = postProcessing.addPost(CCLQueryPost);

        let car = await Engine3D.res.loadGltf('gltfs/glb/PotionBottle.glb');

        let geometry = car.getComponents(MeshRenderer)[0].geometry;
        let model = this.initToothModel(geometry);
        this.scene.addChild(model);

        this.registerEvents();
    }

    private initToothModel(geometry: GeometryBase) {
        let cube = new Object3D();

        let meshRenderer = cube.addComponent(MeshRenderer);
        cube.addComponent(ColliderComponent);

        meshRenderer.geometry = geometry;
        meshRenderer.material = new LitMaterial();


        // GUIUtil.RenderColor(this.srcMaterial, 'selectPlaneColor');
        GUIHelp.add(this, 'isBottomPlane');

        return cube;
    }

    private registerEvents() {
        let pickFire = this.scene.view.pickFire;
        this.scene.view.enablePick = true;
        pickFire.addEventListener(PointerEvent3D.PICK_CLICK, this.onMousePick, this);
        pickFire.addEventListener(PointerEvent3D.PICK_MOVE, this.onMouseMove, this);
    }

    private onMousePick(e: PointerEvent3D) {
        let obj = e.data.pick?.object3D;
        if (obj == null) return;
        let animation = obj.getComponent(SetPlaneAnimation);
        if (!animation) {
            let info = e.data.pickInfo;
            let { worldPos, worldNormal } = info;

            let component = obj.addComponent(SetPlaneAnimation);
            component.playAnimation(worldPos, worldNormal, 300, this.isBottomPlane);
            this.cclPost.setPickData(null);
        }
    }

    private onMouseMove(e: PointerEvent3D) {
        let obj = e.data.pick?.object3D;
        if (obj == null) {
            this.cclPost.setPickData(null, -1);
            return;
        };
        let animation = obj.getComponent(SetPlaneAnimation);
        if (!animation) {
            let info = e.data.pickInfo;
            let { worldPos, worldNormal, meshID } = info;
            this.plane.fromNormalAndPoint(worldNormal, worldPos);
            this.plane.d *= -1;
            this.cclPost.setPickData(this.plane, meshID);
        }
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

        this.scene.addChild(Object3DUtil.GetSingleCube(400, 0.1, 400, 0.2, 0.2, 0.2))
    }

    loop() {

    }
}

new Sample_SetPlane().run();