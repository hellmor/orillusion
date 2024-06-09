import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, View3D, Engine3D, PostProcessingComponent, CameraUtil, Vector3, Object3D, DirectLight, KelvinUtil, MeshRenderer, SphereGeometry, TorusGeometry, Camera3D, HoverCameraController, webGPUContext, GeometryBase } from "../../src";
import { SliceController } from './tooth/slice/SliceController'
import { StencilSliceMaterial } from "./tooth/material/StencilSliceMaterial";
import { SlicePostEffect } from "./tooth/slice/SlicePostEffect";


class Sample_StencilSliceTooth {
    viewSize = 400;
    modelRadius = this.viewSize * 0.5;
    near: number = 1;
    scene: Scene3D;
    view: View3D;
    toothMaterial: StencilSliceMaterial;
    slicePostEffect: SlicePostEffect;
    camera: Camera3D;

    async run() {
        await Engine3D.init();
        GUIHelp.init();

        this.scene = new Scene3D();
        this.camera = CameraUtil.createCamera3DObject(this.scene);
        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = this.camera;

        this.initLight();

        this.toothMaterial = this.createMaterial()
        

        Engine3D.startRenderView(this.view);

        this.validCamera();

        let postProcessing = this.scene.addComponent(PostProcessingComponent);
        this.slicePostEffect = postProcessing.addPost(SlicePostEffect);
        
        await this.initSliceModel();

        requestAnimationFrame(() => {
            this.controller = this.scene.addComponent(SliceController);
            this.controller.initController(this.slicePostEffect.sliceBuffer, this.toothMaterial);
        })

        GUIHelp.add(this, 'IsOrthCamera').onChange(() => this.validCamera());
    }

    IsOrthCamera: boolean = true;
    private validCamera() {
        let camera = this.camera;
        if (this.IsOrthCamera) {
            camera.object3D.removeComponent(HoverCameraController);
            camera.ortho(this.viewSize, this.viewSize, this.near, this.viewSize * 5);
            camera.lookAt(new Vector3(0, -this.near, 0), new Vector3(0, 100, 0), new Vector3(0, 0, 1));

        } else {
            camera.perspective(60, webGPUContext.aspect, 1, 5000.0);
            let ctrl = camera.object3D.addComponent(HoverCameraController);
            ctrl.setCamera(0, -30, this.modelRadius * 2, new Vector3(0, this.modelRadius * 0.5, 0));
        }
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


    async initSliceModel() {

        let obj = new Object3D();
        let renderer = obj.addComponent(MeshRenderer);
        renderer.geometry = await this.loadToothMesh();
        renderer.material = this.toothMaterial;

        this.scene.addChild(obj);


        GUIHelp.add({ sliceIndex: 0 }, 'sliceIndex', 0, this.modelRadius * 2.0, 0.1).onChange(async (value) => {
            this.controller.sliceIndex = value;
            Engine3D.pause()
            let array = await this.controller.read()
            Engine3D.resume()
            console.log(array, array.includes(1))
        });

        GUIHelp.open();
    }

    async loadToothMesh(): Promise<GeometryBase> {
        let model = await Engine3D.res.loadGltf('test.temp.gltf');
        let renderer = model.getComponentsInChild(MeshRenderer)[0];
        return renderer.geometry;
    }

    createMaterial() {
        this.toothMaterial = new StencilSliceMaterial();
        this.toothMaterial.castShadow = false;
        this.toothMaterial.acceptShadow = false;
        this.toothMaterial.doubleSide = true;

        let depthStencil: GPUDepthStencilState = {
            depthWriteEnabled: false,
            depthCompare: 'always',
            stencilWriteMask: 0xFFFFFFFF,
            stencilReadMask: 0xFFFFFFFF,
            stencilFront: { compare: "always", failOp: 'increment-wrap', passOp: 'increment-wrap', depthFailOp: 'increment-wrap' },
            stencilBack: { compare: "always", failOp: 'decrement-wrap', passOp: 'decrement-wrap', depthFailOp: 'decrement-wrap' }
        } as any;

        this.toothMaterial.shader.getDefaultColorShader().depthStencil = depthStencil;
        return this.toothMaterial;
    }

    controller: SliceController;
}

new Sample_StencilSliceTooth().run(); 