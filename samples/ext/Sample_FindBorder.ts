import {
    Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext,
    HoverCameraController, Object3D, DirectLight, KelvinUtil, PlaneGeometry, LitMaterial,
    MeshRenderer,
    ToothClipModel,
    ToothMakeBorder,
    ToothPlanes,
    GeometryBase,
    Material,
    ToothModelTransformer,
    Transform,
    AxisObject,
    ToothMaterial,
} from "@orillusion/core";

import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";

class Sample_FindBorder {
    view: View3D;
    lightObj: Object3D;
    scene: Scene3D;
    srcGeometry: GeometryBase;
    srcMaterial: Material;

    async run() {
        GUIHelp.init();

        // Engine3D.setting.shadow.shadowSize = 2048
        // Engine3D.setting.shadow.shadowBound = 100;

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

        await this.loadSrcAssets();
        this.initRotator();

        GUIHelp.addButton('Start Clip', () => {
            this.initClipModel();
        });
    }

    initClipModel() {
        let clipModel = new ToothClipModel(-50, 50);
        let planes = this.scene.addComponent(ToothPlanes);
        planes.setPlanesHeight(clipModel);
        GUIHelp.add(planes, 'planesVisible')

        GUIHelp.addFolder('Edit Tooth');
        GUIHelp.add(clipModel, 'top', -40, 40, 0.1).onChange((v: number) => { clipModel.top = v; });
        GUIHelp.add(clipModel, 'height', 0, 40, 0.1).onChange((v: number) => { clipModel.height = v; });
        GUIHelp.addButton('Clip Model', () => {
            let renderer = this.toothTransformedRenderer;
            renderer.object3D.removeSelf();
            let newModel = new Object3D();
            this.scene.addChild(newModel);
            let newGeom = clipModel.clip(this.toothTransformer.outputGeometry);
            renderer = newModel.addComponent(MeshRenderer);
            renderer.material = this.srcMaterial;
            renderer.geometry = newGeom;

            GUIHelp.addButton('Build Border', () => {
                const merge = true;
                let maker = new ToothMakeBorder();
                let retGeometries = maker.make(renderer.geometry, clipModel.top - clipModel.height, merge);

                if (merge) {
                    newModel.removeFromParent();
                    this.appendGeometry(retGeometries[0], this.scene);
                } else {
                    for (let item of retGeometries) {
                        this.appendGeometry(item, this.scene);
                    }
                }
            })
        })

        GUIHelp.open();
    }

    appendGeometry(geometry: GeometryBase, parent: Object3D) {
        let borderModel = new Object3D();
        let renderer = borderModel.addComponent(MeshRenderer);
        renderer.geometry = geometry;
        let material = new LitMaterial();
        material.doubleSide = true;
        renderer.material = material;
        parent.addChild(borderModel);

        GUIHelp.add(renderer, 'enable');
    }
    private controller: Transform;
    private toothTransformer: ToothModelTransformer;
    private toothTransformedRenderer: MeshRenderer;
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

        this.toothTransformedRenderer = renderer;
    }

    async loadSrcAssets() {
        let geometry = await this.loadToothMesh();
        this.srcGeometry = geometry;
        this.srcMaterial = new ToothMaterial();
    }

    async loadToothMesh(): Promise<GeometryBase> {
        let model = await Engine3D.res.loadGltf('tooth/blender_glb.glb');
        let renderer = model.getComponentsInChild(MeshRenderer)[0];

        return renderer.geometry;
    }

    async initScene() {
        this.lightObj = new Object3D();
        this.lightObj.rotationX = 35;
        this.lightObj.rotationY = 110;
        this.lightObj.rotationZ = 0;
        let lc = this.lightObj.addComponent(DirectLight);
        lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        lc.castShadow = false;
        lc.intensity = 20;
        lc.indirect = 1
        this.scene.addChild(this.lightObj);
        GUIUtil.renderDirLight(lc, false);
    }
}

new Sample_FindBorder().run();