import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, View3D, Engine3D, PostProcessingComponent, ToothMaterial, CameraUtil, Vector3, Object3D, DirectLight, KelvinUtil, MeshRenderer, SphereGeometry, SliceController } from "../../src";
import { SlicePostEffect } from "../../src/tooth/slice/SlicePostEffect";

class Sample_Slice {
    viewSize = 400;
    modelRadius = this.viewSize * 0.5;
    near: number = 1;
    scene: Scene3D;
    view: View3D;
    toothMaterial: ToothMaterial;
    slicePostEffect: SlicePostEffect;

    async run() {
        await Engine3D.init(
            {
                beforeRender: () => this.renderUpdate(),
                lateRender: () => this.lateUpdate(),
                resumeRender: () => this.isResumeEnable(),
            });
        GUIHelp.init();

        this.scene = new Scene3D();
        this.createOrthoCamera();
        Engine3D.startRenderView(this.view);

        let postProcessing = this.scene.addComponent(PostProcessingComponent);
        this.slicePostEffect = postProcessing.addPost(SlicePostEffect);

        this.initLight();
        this.initSliceModel();
    }

    createOrthoCamera() {
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.ortho(this.viewSize, this.viewSize, this.near, this.viewSize * 5);
        camera.lookAt(new Vector3(0, -this.near, 0), new Vector3(0, 100, 0), new Vector3(0, 0, 1));

        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = camera;
    }

    initLight() {
        let lightObj3D = new Object3D();
        lightObj3D.rotationX = 35;
        lightObj3D.rotationY = 110;
        lightObj3D.rotationZ = 0;
        let directLight = lightObj3D.addComponent(DirectLight);
        directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        directLight.castShadow = true;
        directLight.intensity = 30;
        this.scene.addChild(lightObj3D);
    }

    initSliceModel() {
        let model = new Object3D();
        model.y = this.modelRadius;
        this.scene.addChild(model);

        let renderer = model.addComponent(MeshRenderer);
        renderer.geometry = new SphereGeometry(this.modelRadius, 40, 40);
        this.toothMaterial = renderer.material = new ToothMaterial(true);

        GUIHelp.add({ sliceIndex: 0 }, 'sliceIndex', 0, this.modelRadius * 2.0, 1).onChange((value) => {
            this.controller.sliceIndex = value;
        });
        GUIHelp.open();
    }

    controller: SliceController;

    renderUpdate() {

    }

    lateUpdate() {
        if (!this.controller) {
            this.controller = this.scene.addComponent(SliceController);
            this.controller.initController(this.slicePostEffect.sliceBuffer, this.toothMaterial, this.modelRadius * 2);
        }
        this.controller.lateEngineRender();
    }

    isResumeEnable() {
        return !this.controller || !this.controller.isReading;
    }

}

new Sample_Slice().run(); 