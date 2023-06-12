import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { SerializeTool } from "@orillusion/serialization/SerializeTool";
import { BoxGeometry, Engine3D, LitMaterial, MeshRenderer, Object3D, PlaneGeometry, Scene3D } from "@orillusion/core";
import { createExampleScene } from "@samples/utils/ExampleScene";

class Sample_SerializeScene {
    scene: Scene3D;

    constructor() {
    }

    async run() {
        await Engine3D.init({});

        Engine3D.setting.shadow.shadowBound = 100;
        Engine3D.setting.shadow.shadowBias = 0.002;

        GUIHelp.init();
        let exampleScene = createExampleScene();
        this.scene = exampleScene.scene;

        let urls: string[] = [];
        urls.push('textures/cubemap/skybox_nx.png');
        urls.push('textures/cubemap/skybox_px.png');
        urls.push('textures/cubemap/skybox_py.png');
        urls.push('textures/cubemap/skybox_ny.png');
        urls.push('textures/cubemap/skybox_nz.png');
        urls.push('textures/cubemap/skybox_pz.png');

        this.scene.envMap = await Engine3D.res.loadTextureCubeMaps(urls);

        Engine3D.startRenderView(exampleScene.view);
        await this.initScene();

        GUIHelp.addButton('create prefab', () => {
            let serializeTool = new SerializeTool();
            serializeTool.serialize(this.scene);
            console.log(JSON.stringify(serializeTool.data))
        })
        GUIHelp.open();
    }

    async initScene() {

        let floor: Object3D;
        {
            let mat = new LitMaterial();
            mat.name = 'myMaterial1';
            mat.baseMap = Engine3D.res.grayTexture;
            mat.roughness = 0.85;
            mat.metallic = 0.1;
            floor = new Object3D();
            floor.name = 'floor';
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new PlaneGeometry(500, 500, 4);
            mr.material = mat;
            this.scene.addChild(floor);
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
            mr.geometry = new BoxGeometry(100, 20, 50);
            mr.material = mat;
            floor.addChild(box);
        }
        {
            let Duck = await Engine3D.res.loadGltf('PBR/Duck/Duck.gltf') as Object3D;
            Duck.scaleX = Duck.scaleY = Duck.scaleZ = 0.15;
            Duck.transform.y = 0;
            Duck.transform.x = -16;
            Duck.transform.z = 36;
            this.scene.addChild(Duck);
        }

    }

}

new Sample_SerializeScene().run();