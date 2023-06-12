import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { SerializeTool } from "@orillusion/serialization/SerializeTool";
import { AtmosphericComponent, BoxGeometry, Engine3D, GTAOPost, HDRBloomPost, LitMaterial, MeshRenderer, Object3D, PlaneGeometry, PostProcessingComponent, Scene3D, SkyRenderer, TAAPost } from "@orillusion/core";
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { GUIUtil } from "@samples/utils/GUIUtil";

class Sample_SerializeScene {
    scene: Scene3D;

    constructor() {
    }

    async run() {
        await Engine3D.init({});

        Engine3D.setting.shadow.shadowBound = 100;
        Engine3D.setting.shadow.shadowBias = 0.0005;

        GUIHelp.init();
        let param = createSceneParam();
        param.camera.distance = 88;
        param.camera.roll = -65;
        param.light.intensity = 20;
        param.scene.atmosphericSky = null;
        let exampleScene = createExampleScene(param);
        this.scene = exampleScene.scene;
        let urls: string[] = [];
        urls.push('textures/cubemap/skybox_nx.png');
        urls.push('textures/cubemap/skybox_px.png');
        urls.push('textures/cubemap/skybox_py.png');
        urls.push('textures/cubemap/skybox_ny.png');
        urls.push('textures/cubemap/skybox_nz.png');
        urls.push('textures/cubemap/skybox_pz.png');
        let sky = this.scene.addComponent(SkyRenderer);
        this.scene.envMap = sky.map = await Engine3D.res.loadTextureCubeMaps(urls);
        sky.exposure = 0.5;
        Engine3D.startRenderView(exampleScene.view);

        let postProcessing = this.scene.addComponent(PostProcessingComponent);
        let gtao = postProcessing.addPost(GTAOPost);
        GUIUtil.renderGTAO(Engine3D.setting.render.postProcessing.gtao, 50, false);

        postProcessing.addPost(HDRBloomPost);

        await this.initScene();

        GUIHelp.addButton('create prefab', async () => {
            await this.makePrefab();
        })
        GUIHelp.open();
    }

    private async makePrefab() {
        let serializeTool = new SerializeTool();
        serializeTool.serialize(this.scene);
        console.log(JSON.stringify(serializeTool.data))
    }

    async initScene() {

        let floor: Object3D;
        {
            let mat = new LitMaterial();
            mat.name = 'myMaterial1';
            mat.baseMap = Engine3D.res.whiteTexture;
            mat.roughness = 0.85;
            mat.metallic = 0.1;
            floor = new Object3D();
            floor.name = 'floor';
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new PlaneGeometry(500, 500, 4);
            mr.material = mat;
            this.scene.addChild(floor);
            floor.y = -1;
        }

        {
            let mat = new LitMaterial();
            mat.name = 'myMaterial2';
            let texture = await Engine3D.res.loadTexture('gltfs/dizuo/0_diffuse.jpg')
            mat.baseMap = texture;
            mat.roughness = 0.85;
            mat.metallic = 0.1;
            let box = new Object3D();
            box.name = 'box'
            let mr = box.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(40, 30, 50);
            mr.material = mat;
            floor.addChild(box);
        }
        {
            let Duck = await Engine3D.res.loadGltf('PBR/Duck/Duck.gltf') as Object3D;
            Duck.scaleX = Duck.scaleY = Duck.scaleZ = 0.15;
            Duck.transform.y = -5;
            Duck.transform.x = -16;
            Duck.transform.z = 36;

            Duck.transform.rotationY = 125;
            Duck.transform.rotationX = 20;

            this.scene.addChild(Duck);
        }

    }

}

new Sample_SerializeScene().run();