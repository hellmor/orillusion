import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, View3D, Engine3D, CameraUtil, webGPUContext, HoverCameraController, LitMaterial, BoxGeometry, Object3D, MeshRenderer, DirectLight, KelvinUtil, Color, Vector2, Rect, VertexAttributeName, Vector3, Camera3D, Matrix4 } from "../../src";

class BoxSelectorJS {
    src_v3: Vector3 = new Vector3();
    dest_v3: Vector3 = new Vector3();
    vp: Matrix4 = new Matrix4();

    select(camera: Camera3D, rect: Rect, meshRenderers: MeshRenderer[], result: Set<string>) {
        let src_v3 = this.src_v3;
        let dest_v3 = this.dest_v3;
        let vp = this.vp;
        vp.copyFrom(camera.viewMatrix);
        vp.multiply(camera.projectionMatrix);

        let w = webGPUContext.canvas.clientWidth / 2;
        let h = webGPUContext.canvas.clientHeight / 2;
        let x: number;
        let y: number;

        for (let renderer of meshRenderers) {
            let matrix = renderer.transform.worldMatrix;
            let srcPosition = renderer.geometry.vertexAttributeMap.get(VertexAttributeName.position);
            let f32Array = new Float32Array(srcPosition.data.buffer);
            let triangleCount = f32Array.length / 3;

            let offset = 0;
            for (let i = 0; i < triangleCount; i++) {
                offset = i * 3;
                src_v3.set(f32Array[offset], f32Array[offset] + 1, f32Array[offset] + 2);
                matrix.transformPoint(src_v3, dest_v3);
                vp.perspectiveMultiplyPoint3(dest_v3, src_v3);

                x = src_v3.x * w + w;
                y = h - src_v3.y * h;
                if (rect.inner(x, y)) {
                    result.add(renderer.instanceID);
                    break;
                }
            }
        }
        return result;
    }
}

class Sample_BoxSelection {
    scene: Scene3D;
    view: View3D;

    async run() {
        await Engine3D.init({ beforeRender: () => this.renderUpdate() });
        GUIHelp.init();
        this.scene = new Scene3D();

        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
        mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(30, -45, 80);

        this.initLight();
        this.initScene(this.scene);


        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = mainCamera;

        Engine3D.startRenderView(this.view);

        this.initGUI();
    }

    private rect: Rect = new Rect(200, 200, 300, 350);
    initGUI() {
        GUIHelp.addFolder('Rect');
        GUIHelp.add(this.rect, 'x', 0, 400);
        GUIHelp.add(this.rect, 'y', 0, 400);
        GUIHelp.add(this.rect, 'width', 100, 749);
        GUIHelp.add(this.rect, 'height', 100, 753);
        GUIHelp.open();
        GUIHelp.endFolder();
    }


    private red: LitMaterial;
    private green: LitMaterial;
    private meshRenderers: MeshRenderer[] = [];
    initScene(scene: Scene3D) {
        this.red = new LitMaterial();
        this.red.baseColor = new Color(1, 0, 0, 1);
        this.green = new LitMaterial();
        this.green.baseColor = new Color(0, 1, 0, 1);

        const boxSize = 1;
        const halfSize = boxSize / 2;

        const count = 20;
        for (let i = 0; i < count; i++) {
            let cubeGeometry = new BoxGeometry(1, 2, 1);
            for (let j = 0; j < count; j++) {
                let obj: Object3D = new Object3D();
                let mr = obj.addComponent(MeshRenderer);
                mr.material = this.green;
                mr.geometry = cubeGeometry;
                obj.localScale = obj.localScale;
                obj.x = (i - halfSize) * 4;
                obj.z = (j - halfSize) * 4;
                obj.y = (Math.random() - 0.5) * count;
                obj.rotationX = (Math.random() - 0.5) * 90;
                obj.rotationY = (Math.random() - 0.5) * 90;
                obj.rotationZ = (Math.random() - 0.5) * 90;
                scene.addChild(obj);
                this.meshRenderers.push(mr);
            }
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

    private select: BoxSelectorJS;
    private resultIDs: Set<string> = new Set();
    renderUpdate() {
        this.select ||= new BoxSelectorJS();
        this.resultIDs.clear();
        this.select.select(this.view.camera, this.rect, this.meshRenderers, this.resultIDs);
        for (let item of this.meshRenderers) {
            item.material = this.resultIDs.has(item.instanceID) ? this.green : this.red;
        }
    }

}

new Sample_BoxSelection().run();
