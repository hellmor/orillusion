import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, Keyframe, Object3DUtil, Time, Vector3 } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";

class Sample_MultiView {
    scene0: Scene3D;
    scene1: Scene3D;
    Duck: Object3D;

    async run() {
        await Engine3D.init({ beforeRender: () => this.renderUpdate() });

        Engine3D.setting.render.debug = true;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.type = `HARD`;
        Engine3D.setting.shadow.csmScatteringExp = 0.5;
        GUIHelp.init();

        this.scene0 = new Scene3D();
        this.scene0.addComponent(AtmosphericComponent);

        let cameraBase = CameraUtil.createCamera3DObject(this.scene0);
        cameraBase.perspective(60, Engine3D.aspect, 0.01, 5000.0);

        cameraBase.object3D.addComponent(HoverCameraController).setCamera(-30, -45, 200);

        let viewBase = new View3D();
        viewBase.scene = this.scene0;
        viewBase.camera = cameraBase;


        this.scene1 = new Scene3D();
        let orthCamera = CameraUtil.createCamera3DObject(this.scene1);
        orthCamera.ortho(40, 40, 1, 100);
        orthCamera.transform.z = -20;
        orthCamera.transform.lookAt(new Vector3(0, 0, -20), new Vector3(0, 0, 0), new Vector3(0, 0, 1));

        let viewTop = new View3D();
        viewTop.scene = this.scene1;
        viewTop.camera = orthCamera;

        await this.initSceneBase();
        this.initSceneTop();

        Engine3D.startRenderViews([viewBase, viewTop]);
    }

    async initSceneBase() {
        this.addLight(this.scene0);
        this.scene0.addChild(Object3DUtil.GetSingleCube(300, 5, 300, 1, 1, 1));
        // load a gltf model
        this.Duck = (await Engine3D.res.loadGltf('PBR/Duck/Duck.gltf')) as Object3D;
        this.Duck.scaleX = this.Duck.scaleY = this.Duck.scaleZ = 0.3;
        this.Duck.name = "Duck"
        this.scene0.addChild(this.Duck);
    }

    initSceneTop() {
        this.addLight(this.scene1);
        let cube = Object3DUtil.GetSingleCube(20, 20, 20, 1, 0, 0);
        this.scene1.addChild(cube);
        GUIUtil.renderTransform(cube.transform)

    }

    addLight(scene: Scene3D) {
        let light = new Object3D();
        light.rotationX = 35;
        light.rotationY = 110;
        light.rotationZ = 0;
        let directLight = light.addComponent(DirectLight);
        directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        directLight.castShadow = true;
        directLight.intensity = 30;
        scene.addChild(light);
    }


    renderUpdate() {

    }
}

new Sample_MultiView().run();