import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, View3D, Engine3D, PostProcessingComponent, ToothMaterial, CameraUtil, Vector3, Object3D, DirectLight, KelvinUtil, MeshRenderer, SphereGeometry, SliceController, SliceCompute } from "../../src";
import { SlicePostEffect } from "../../src/tooth/slice/SlicePostEffect";

class Sample_ComputeSlice {
    viewSize = 400;
    modelRadius = this.viewSize * 0.5;
    near: number = 1;
    scene: Scene3D;
    view: View3D;
    toothMaterial: ToothMaterial;

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

    private compute: SliceCompute;

    initSliceModel() {
        let model = new Object3D();
        model.y = this.modelRadius;
        this.scene.addChild(model);

        let renderer = model.addComponent(MeshRenderer);
        renderer.geometry = new SphereGeometry(this.modelRadius, 40, 40);
        this.toothMaterial = renderer.material = new ToothMaterial(true);

        GUIHelp.addButton('Click', () => {
            if (this.compute == null) {
                this.compute = new SliceCompute().init();
            }
            let time = performance.now();
            this.compute.compute(this.view, renderer.transform.worldMatrix, renderer.geometry, 10);
            // this.compute.getPickWorldNormal();
            console.log(performance.now() - time);

        })
        GUIHelp.open();
    }

    controller: SliceController;

    renderUpdate() {

    }

    lateUpdate() {
        // if (!this.controller) {
        //     this.controller = this.scene.addComponent(SliceController);
        //     this.controller.initController(this.slicePostEffect.sliceBuffer, this.toothMaterial, this.modelRadius * 2);
        // }
        // this.controller.lateEngineRender();
    }

    isResumeEnable() {
        return true;
    }

}

new Sample_ComputeSlice().run(); 