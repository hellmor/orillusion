import {
    Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext,
    HoverCameraController, Object3D, DirectLight, KelvinUtil, PlaneGeometry, LitMaterial,
    MeshRenderer,
    ToothClipModel,
    ToothMakeBorder,
    ToothPlanes,
    GeometryBase,
    Object3DUtil,
    AxisObject,
    Transform,
    ToothModelTransformer,
    Material,
} from "@orillusion/core";

import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";

class Sample_RotateGeometry {
    view: View3D;
    lightObj: Object3D;
    scene: Scene3D;
    srcGeometry: GeometryBase;
    srcMaterial: Material;

    async run() {
        GUIHelp.init();

        Engine3D.setting.shadow.shadowSize = 2048
        Engine3D.setting.shadow.shadowBound = 100;

        await Engine3D.init();

        this.scene = new Scene3D();
        let sky = this.scene.addComponent(AtmosphericComponent);
        sky.sunY = 0.6;

        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
        mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(30, -15, 100);

        this.initScene();
        sky.relativeTransform = this.lightObj.transform;

        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = mainCamera;
        Engine3D.startRenderView(this.view);
    }

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

        await this.initMesh();
        this.initRotator();
    }

    private controller: Transform;
    private toothTransformer: ToothModelTransformer;
    initRotator() {
        this.controller = new AxisObject(10, 0.2).transform;
        this.scene.addChild(this.controller.object3D);

        this.toothTransformer = new ToothModelTransformer(this.srcGeometry);

        GUIUtil.renderTransform(this.controller, true, 'Rotate Tooth', () => {
            this.toothTransformer.transform(this.controller.worldMatrix);
        });

        this.displayOutputGeometry();
    }

    private displayOutputGeometry() {
        let obj = new Object3D();
        let renderer = obj.addComponent(MeshRenderer);
        renderer.material = this.srcMaterial;
        renderer.geometry = this.toothTransformer.outputGeometry;
        this.scene.addChild(obj);
    }

    async initMesh() {
        let renderer = await this.loadToothMesh();
        this.srcGeometry = renderer.geometry;
        this.srcMaterial = renderer.material;
    }

    async loadToothMesh(): Promise<MeshRenderer> {
        let model = await Engine3D.res.loadGltf('tooth/blender_glb.glb');
        let renderer = model.getComponentsInChild(MeshRenderer)[0];
        renderer.material = new LitMaterial();

        return renderer;
    }
}

new Sample_RotateGeometry().run();