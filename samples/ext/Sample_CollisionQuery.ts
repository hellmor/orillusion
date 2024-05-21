import {
    Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext,
    HoverCameraController, Object3D, DirectLight, KelvinUtil,
    MeshRenderer,
    Object3DUtil,
    CollisionSetting,
    PostProcessingComponent,
    CEventDispatcher,
    CollisionEventName,
    CEvent,
    setFrameDelay,
    Color,
    LitMaterial,
    BoxGeometry,

} from "@orillusion/core";

import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { CollisionDebugPost } from "./collision/CollisionDebugPost";

class Sample_CollisionQuery {
    view: View3D;
    scene: Scene3D;

    private _collisionSrcRenderer: MeshRenderer[];
    async run() {
        GUIHelp.init();
        this.initCollisionSetting();



        Engine3D.setting.shadow.shadowSize = 2048
        Engine3D.setting.shadow.shadowBound = 100;

        await Engine3D.init();

        this.scene = new Scene3D();
        let sky = this.scene.addComponent(AtmosphericComponent);
        sky.sunY = 0.6;

        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
        mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(60, -45, 80);

        let light = this.initLight();
        sky.relativeTransform = light.transform;

        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = mainCamera;

        this.makeFloor();

        let duck = await Engine3D.res.loadGltf('PBR/Duck/Duck.gltf');
        duck.scaleX = duck.scaleY = duck.scaleZ = 0.2;
        duck.y = 1;
        this.scene.addChild(duck);

        GUIHelp.addFolder('Duck');
        GUIHelp.add(duck, 'x', -100, 100, 1);
        GUIHelp.add(duck, 'z', -100, 100, 1);
        GUIHelp.open();
        GUIHelp.endFolder();

        let boxList = [];
        for (let i = 0; i < 5; i++) {
            let box = this.makeCollisionBox(i);
            boxList.push(box);
            GUIHelp.addFolder('Box ' + i);
            GUIHelp.add(box, 'x', -100, 100, 1);
            GUIHelp.add(box, 'z', -100, 100, 1);
            GUIHelp.open();
            GUIHelp.endFolder();
        }
        this.enableCollisionObject([...boxList, duck], true);

        let job = Engine3D.startRenderView(this.view);
        //等待一帧后，才能拿到job.collisionRenderer;
        await setFrameDelay(1);
        job.collisionRenderer.addEventListener(CollisionEventName, this.onCollision, this);
        this.showCollisionObjects(null);

        GUIHelp.add(CollisionSetting, 'Enable');

        // 用于debug Collision的texture
        // let post = this.scene.getOrAddComponent(PostProcessingComponent);
        // post.addPost(CollisionDebugPost);
    }

    private initCollisionSetting() {

        CollisionSetting.Enable = true;

        CollisionSetting.RTWidth = CollisionSetting.RTHeight = 2048;

        // 相机的坐标，XZ设置到需要打印的平台的物体的AABB的中间即可。Y用默认的即可
        // CollisionSetting.CameraX 
        // CollisionSetting.CameraY
        // CollisionSetting.CameraZ

        // CollisionSetting的其他参数看CollisionSetting.ts里的描述
    }

    private onCollision(e: CEvent) {
        let { latest, history } = e.data;
        this.showCollisionObjects(latest as any);
    }

    private showCollisionObjects(idMap: Set<number>) {
        console.log(idMap);
        for (let renderer of this._collisionSrcRenderer) {
            let isCollision = idMap?.has(renderer.transform.worldMatrix.index);
            let color = isCollision ? new Color(1, 0, 0, 1) : new Color(1, 1, 1, 1);
            for (let mat of renderer.materials) {
                mat['baseColor'] = color;
            }
        }
    }

    private makeCollisionBox(index: number) {
        let box = new Object3D();
        let renderer = box.addComponent(MeshRenderer);
        renderer.geometry = new BoxGeometry(1, 1, 1);
        renderer.material = new LitMaterial();
        renderer.geometry.name = 'testBox' + index;
        box.scaleX = box.scaleZ = 2;
        box.scaleY = 2;
        box.x = (Math.random() - 0.5) * 40;
        box.z = (Math.random() - 0.5) * 40;
        box.y = 8;

        this.scene.addChild(box);
        return box;
    }

    private makeFloor() {
        let floor = Object3DUtil.GetSingleCube(
            CollisionSetting.ViewPortWidth - 1,
            1,
            CollisionSetting.ViewPortHeight - 1,
            0.2, 0.2, 0.2);
        this.scene.addChild(floor);
    }

    //指定会发生碰撞的Object3D对象
    private enableCollisionObject(objs: Object3D[], enable: boolean) {
        this._collisionSrcRenderer = [];
        for (let obj of objs) {
            let renderers = obj.getComponents(MeshRenderer);
            for (let renderer of renderers) {
                renderer.castCollision = enable;
                this._collisionSrcRenderer.push(renderer);
            }
        }
    }

    private initLight() {
        let lightObj = new Object3D();
        lightObj.rotationX = 35;
        lightObj.rotationY = 110;
        lightObj.rotationZ = 0;
        let lc = lightObj.addComponent(DirectLight);
        lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        lc.castShadow = true;
        lc.intensity = 20;
        lc.indirect = 1
        this.scene.addChild(lightObj);
        return lc;
    }

}

new Sample_CollisionQuery().run();