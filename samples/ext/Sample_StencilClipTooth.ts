import {
    Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext,
    HoverCameraController, Object3D, DirectLight, KelvinUtil, LitMaterial,
    MeshRenderer,
    GeometryBase,
    StencilSliceMaterial,
    ToothClipTag,
    Color,
    PlaneGeometry,
    UnLitMaterial,
    BoxGeometry,
} from "@orillusion/core";

import { GUIHelp } from "@orillusion/debug/GUIHelp";

class Sample_StencilClipTooth {
    view: View3D;
    lightObj: Object3D;
    scene: Scene3D;
    srcGeometry: GeometryBase;
    toothBack: StencilSliceMaterial;
    planeRenderer: MeshRenderer;

    async run() {
        GUIHelp.init();

        Engine3D.setting.shadow.shadowSize = 2048
        Engine3D.setting.shadow.shadowBound = 100;

        await Engine3D.init({ renderLoop: () => { this.loop() } });

        this.scene = new Scene3D();
        let sky = this.scene.addComponent(AtmosphericComponent);
        sky.sunY = 0.6;

        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
        mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(60, -15, 100);

        this.initScene();
        sky.relativeTransform = this.lightObj.transform;

        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = mainCamera;
        Engine3D.startRenderView(this.view);

        await this.loadSrcAssets();

        this.getToothMaterial();

        GUIHelp.addFolder('Plane ');
        let clipMode = {
            None: ToothClipTag.None,
            Positive: ToothClipTag.Positive,
            Negative: ToothClipTag.Negative,
        }

        GUIHelp.add({ clipMode: this.toothBack.getClipEnable() }, 'clipMode', clipMode).onChange((v) => {
            let tag = parseInt(v) as ToothClipTag;
            this.toothBack.setClipEnable(tag);
        });

        let updatePlanes = (value: number) => {
            this.toothBack.setClipPosition(value);
        }

        let planeObj = this.initPlane();
        GUIHelp.add(planeObj.transform, 'y', -200, 200, 0.01).onChange(updatePlanes);
        this.scene.addChild(planeObj);

        updatePlanes(0);

        GUIHelp.open();
        GUIHelp.endFolder();
    }


    getToothMaterial() {
        if (this.toothBack) return this.toothBack;

        this.toothBack = new StencilSliceMaterial();
        this.toothBack.castShadow = false;
        this.toothBack.acceptShadow = false;
        this.toothBack.doubleSide = true;

        let depthStencil: GPUDepthStencilState = {
            depthWriteEnabled: false,
            depthCompare: 'always',
            stencilWriteMask: 0xFFFFFFFF,
            stencilReadMask: 0xFFFFFFFF,
            stencilFront: { compare: "always", failOp: 'increment-wrap', passOp: 'increment-wrap', depthFailOp: 'increment-wrap' },
            stencilBack: { compare: "always", failOp: 'decrement-wrap', passOp: 'decrement-wrap', depthFailOp: 'decrement-wrap' }
        } as any;

        this.toothBack.shader.getDefaultColorShader().depthStencil = depthStencil;

        return this.toothBack;
    }

    initPlane() {
        let plane = new Object3D();
        let renderer = plane.addComponent(MeshRenderer);
        let geometry = new PlaneGeometry(4096, 4096);
        let material = new UnLitMaterial();
        material.baseColor = new Color(1, 0, 0, 1);
        material.castShadow = false;
        material.acceptShadow = false;
        material.doubleSide = true;

        let depthStencil: GPUDepthStencilState = {
            depthWriteEnabled: false,
            depthCompare: 'always',
            stencilWriteMask: 0xFFFFFFFF,
            stencilReadMask: 0xFFFFFFFF,
            stencilBack: { compare: "not-equal", failOp: 'replace', passOp: 'replace', depthFailOp: 'replace' },
            stencilFront: { compare: "not-equal", failOp: 'replace', passOp: 'replace', depthFailOp: 'replace' }
        } as any;
        material.shader.getDefaultColorShader().depthStencil = depthStencil;
        renderer.geometry = geometry;
        renderer.material = material;
        this.scene.addChild(plane);
        return plane;
    }

    async loadSrcAssets() {
        let renderer = await this.loadToothMesh();
        this.srcGeometry = renderer.geometry;

        const length = 5;
        for (let i = 0; i < length; i++) {
            let cubeGeometry = new BoxGeometry(10, 60, 10);
            for (let j = 0; j < length; j++) {
                let obj: Object3D = new Object3D();
                let mr = obj.addComponent(MeshRenderer);
                mr.material = this.getToothMaterial();
                mr.geometry = cubeGeometry;
                obj.localScale = obj.localScale;
                obj.x = (i - 2.5) * 10;
                obj.z = (j - 2.5) * 10;
                obj.y = 20;
                obj.rotationX = (Math.random() - 0.5) * 80;
                obj.rotationY = (Math.random() - 0.5) * 90;
                this.scene.addChild(obj);
            }
        }

        // {
        //     let obj = new Object3D();
        //     renderer = obj.addComponent(MeshRenderer);
        //     renderer.geometry = this.srcGeometry;
        //     renderer.material = this.getToothMaterial();
        //     obj.scaleX = obj.scaleY = obj.scaleZ = 10;
        //     this.scene.addChild(renderer.object3D);
        // }
    }

    async loadToothMesh(): Promise<MeshRenderer> {
        let model = await Engine3D.res.loadGltf('tooth/zhicheng.gltf');
        let renderer = model.getComponentsInChild(MeshRenderer)[0];
        renderer.material = new LitMaterial();
        return renderer;
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
    }

    loop() {

    }
}

new Sample_StencilClipTooth().run();