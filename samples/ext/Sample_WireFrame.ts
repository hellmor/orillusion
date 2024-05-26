import { AtmosphericComponent, BoxGeometry, CameraUtil, Color, CylinderGeometry, DirectLight, Engine3D, FXAAPost, GlobalFog, HoverCameraController, KelvinUtil, LitMaterial, MeshRenderer, Object3D, Object3DUtil, PlaneGeometry, PostProcessingComponent, Scene3D, Vector2, Vector3, View3D, webGPUContext } from '@orillusion/core';
import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { GUIUtil } from '@samples/utils/GUIUtil';
import { ToothPlatWireframe } from './ToothPlatWireframe';

export class Sample_WireFrame {
    lightObj: Object3D;
    scene: Scene3D;
    boxWireFrame: ToothPlatWireframe;

    box: Object3D;
    async run() {
        Engine3D.setting.shadow.enable = true;
        Engine3D.setting.shadow.shadowSize = 2048
        Engine3D.setting.shadow.shadowBound = 200;
        Engine3D.setting.shadow.shadowBias = 0.05;

        await Engine3D.init({
            canvasConfig: {
                devicePixelRatio: 1
            },
            renderLoop: () => this.loop()
        })

        this.scene = new Scene3D()
        this.scene.addComponent(AtmosphericComponent).sunY = 0.6

        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera')
        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0)
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController)
        ctrl.setCamera(-75, -20, 40)
        await this.initScene()

        let view = new View3D()
        view.scene = this.scene
        view.camera = mainCamera
        Engine3D.startRenderView(view)

        let postProcessing = this.scene.addComponent(PostProcessingComponent)
        postProcessing.addPost(FXAAPost)

        this.box = Object3DUtil.GetSingleCube(20, 20, 20, 0.5, 0.5, 0.5);
        this.scene.addChild(this.box);

        this.boxWireFrame = this.box.addComponent(ToothPlatWireframe);
        this.boxWireFrame.initWireframe('aa', new Color(0.4, 0.4, 0.4, 1));

        GUIHelp.init();
        GUIUtil.renderTransform(this.box.transform);
        GUIHelp.add(this, 'rowCount', 4, 20, 1).onChange(v => this.updateBoxWireframe());
        GUIHelp.add(this, 'colCount', 4, 20, 1).onChange(v => this.updateBoxWireframe());
        GUIHelp.add(this.size, 'x', 1, 20, 1).onChange(v => this.updateBoxWireframe());
        GUIHelp.add(this.size, 'y', 10, 20, 1).onChange(v => this.updateBoxWireframe());
        GUIHelp.add(this.size, 'z', 10, 20, 1).onChange(v => this.updateBoxWireframe());

        this.updateBoxWireframe();
    }

    initScene() {
        this.lightObj = new Object3D();
        this.lightObj.rotationX = 45;
        this.lightObj.rotationY = 110;
        this.lightObj.rotationZ = 0;
        let light = this.lightObj.addComponent(DirectLight);
        light.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        light.castShadow = true;
        light.intensity = 10;
        this.scene.addChild(this.lightObj);
    }

    private rowCount = 8;
    private colCount = 4;
    private size: Vector3 = new Vector3(20, 20, 20);
    private updateBoxWireframe() {
        let sizeX = this.size.x * 0.5;
        let sizeY = this.size.y * 0.5;
        let sizeZ = this.size.z * 0.5;
        this.boxWireFrame.rebuild(new Vector3(-sizeX, -sizeY, -sizeZ), new Vector3(sizeX, sizeY, sizeZ), this.colCount, this.rowCount);
    }

    loop() {
    }

}

