import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createSceneParam, createExampleScene } from "@samples/utils/ExampleScene";
import { Engine3D, Object3D, Scene3D } from "@orillusion/core";
import { PrefabLoader } from "@orillusion/serialization/unSerialize/PrefabLoader";

class Sample_LoadQuotePrefab {
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
        GUIHelp.addButton('Load Prefab(Quote)', () => {
            this.loadPrefab();
        })
        GUIHelp.open();
    }

    private async loadPrefab() {
        const url = 'prefab/quote_duck.json';
        await Engine3D.res.loadPrefab(url, PrefabLoader);
        let duck: Object3D = Engine3D.res.instantiatePrefab(url);
        duck.scaleX = duck.scaleY = duck.scaleZ = 0.1;
        this.scene.addChild(duck);

    }
}

new Sample_LoadQuotePrefab().run();