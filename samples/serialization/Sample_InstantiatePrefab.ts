import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createSceneParam, createExampleScene } from "@samples/utils/ExampleScene";
import { Engine3D, Object3D, Scene3D } from "@orillusion/core";
import { PrefabLoader } from "@orillusion/serialization/unSerialize/PrefabLoader";
import { SerializeTool } from "@orillusion/serialization/SerializeTool";

class Sample_InstantiatePrefab {
    scene: Scene3D;

    async run() {
        await Engine3D.init({});

        Engine3D.setting.shadow.shadowBound = 100;
        Engine3D.setting.shadow.shadowBias = 0.0005;

        let param = createSceneParam();
        param.camera.distance = 88;
        param.camera.roll = -65;
        param.light.intensity = 20;

        let exampleScene = createExampleScene(param);
        this.scene = exampleScene.scene;
        Engine3D.startRenderView(exampleScene.view);
        GUIHelp.init();
        GUIHelp.addButton('Instantiate Prefab', () => {
            this.loadPrefab();
        })
        GUIHelp.open();
    }

    private async loadPrefab() {
        const url = 'prefab/duck.json';
        await Engine3D.res.loadPrefab(url, PrefabLoader);
        let duck: Object3D;
        for (let i = 0; i < 10; i++) {
            duck = Engine3D.res.instantiatePrefab(url);
            duck.x = i * 10 - 50;
            duck.scaleX = duck.scaleY = duck.scaleZ = 0.1 * (i + 10) / 20;
            duck.rotationY = i * 20;
            this.scene.addChild(duck);
        }

        GUIHelp.addButton('Make Prefab(Quote)', () => {
            let serializeTool = new SerializeTool();
            serializeTool.serialize(duck);
            console.log(JSON.stringify(serializeTool.data));
        })

    }
}

new Sample_InstantiatePrefab().run();