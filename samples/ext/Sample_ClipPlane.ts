import {
    Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext,
    HoverCameraController, Object3D, DirectLight, KelvinUtil, LitMaterial,
    MeshRenderer,
    GeometryBase,
    ToothMaterial,
    Vector3,
    ToothClipTag,
    Object3DUtil,
    BlendMode,
    Plane3D,
    Plane,
} from "@orillusion/core";

import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";

class PlaneBinder {
    planeRenderer: MeshRenderer;
    plane3D: Plane3D;
    onChange: Function;

    public bind(plane: Plane3D, index: number, onChange: Function): MeshRenderer {
        let planeObj = Object3DUtil.GetSingleCube(80, 80, 0.1, 0.5, 0.5, 0.5);
        this.plane3D = plane;
        this.planeRenderer = planeObj.getComponent(MeshRenderer);
        this.planeRenderer.enable = false;
        this.onChange = onChange;

        let changePlaneObj = () => {
            this.copyData(this.plane3D, this.planeRenderer);
            onChange?.();
        }

        GUIUtil.renderTransform(planeObj.transform, false, 'Transform' + index, changePlaneObj);

        changePlaneObj();
        return this.planeRenderer;
    }


    public copyData(plane: Plane3D, renderer: MeshRenderer) {
        plane.fromNormalAndPoint(renderer.transform.forward, renderer.transform.localPosition);
        plane.d *= -1;
    }
}

class Sample_ClipPlane {
    view: View3D;
    lightObj: Object3D;
    scene: Scene3D;
    srcGeometry: GeometryBase;
    srcMaterial: ToothMaterial;

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
        ctrl.setCamera(30, -15, 100);

        this.initScene();
        sky.relativeTransform = this.lightObj.transform;

        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = mainCamera;
        Engine3D.startRenderView(this.view);

        await this.loadSrcAssets();

        let planes = this.srcMaterial.clipPlanes;

        GUIUtil.RenderColor(this.srcMaterial, 'backFaceColor');

        for (let i = 0; i < 4; i++) {
            GUIHelp.addFolder('Plane ' + i);
            let clipMode = {
                None: ToothClipTag.None,
                Positive: ToothClipTag.Positive,
                Negative: ToothClipTag.Negative,
            }

            GUIHelp.add({ clipMode: this.srcMaterial.getClipEnable(i) }, 'clipMode', clipMode).onChange((v) => {
                let tag = parseInt(v) as ToothClipTag;
                this.srcMaterial.setClipEnable(i, tag);
            });

            let updatePlanes = () => {
                this.srcMaterial.clipPlanes = planes;
            }

            let plane = planes[i];

            let binder = new PlaneBinder();
            binder.bind(plane, i, updatePlanes);
            this.planeBinder.push(binder);
            this.scene.addChild(binder.planeRenderer.object3D);

            updatePlanes();

            GUIHelp.endFolder();
        }
    }

    async loadSrcAssets() {
        let renderer = await this.loadToothMesh();
        this.srcGeometry = renderer.geometry;
        this.srcMaterial = new ToothMaterial();
        this.srcMaterial.doubleSide = true;

        let obj = new Object3D();
        renderer = obj.addComponent(MeshRenderer);
        renderer.object3D.rotationX = 90;
        renderer.geometry = this.srcGeometry;
        renderer.material = this.srcMaterial;
        this.scene.addChild(renderer.object3D);
    }

    async loadToothMesh(): Promise<MeshRenderer> {
        let model = await Engine3D.res.loadGltf('tooth/blender_glb.glb');
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
        GUIUtil.renderDirLight(lc, false);
    }

    planeBinder: PlaneBinder[] = [];
    loop() {
        for (let i = 0; i < Math.min(this.planeBinder.length, 2); i++) {
            let binder = this.planeBinder[i];
            this.view.graphic3D.drawMeshWireframe('binder' + i, binder.planeRenderer.geometry, binder.planeRenderer.transform);
        }
    }
}

new Sample_ClipPlane().run();