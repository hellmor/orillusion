import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { SerializeTool } from "@orillusion/serialization/SerializeTool";
import { Engine3D, Object3D } from "@orillusion/core";
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";

class Sample_MakePrefab {
    private duck: Object3D;

    async run() {
        await Engine3D.init({});

        Engine3D.setting.shadow.shadowBound = 100;
        Engine3D.setting.shadow.shadowBias = 0.0005;

        let param = createSceneParam();
        param.camera.distance = 88;
        param.camera.roll = -65;
        param.light.intensity = 20;
        let exampleScene = createExampleScene(param);
        Engine3D.startRenderView(exampleScene.view);

        {
            let Duck = await Engine3D.res.loadGltf('PBR/Duck/Duck.gltf');
            Duck.scaleX = Duck.scaleY = Duck.scaleZ = 0.15;
            Duck.transform.y = 0;
            Duck.transform.x = -16;
            Duck.transform.z = 36;
            exampleScene.scene.addChild(Duck);
            this.duck = Duck;
            GUIHelp.init();
        }

        GUIHelp.addButton('Make Prefab', () => {
            let serializeTool = new SerializeTool();
            serializeTool.serialize(this.duck);
            console.log(JSON.stringify(serializeTool.data));
        })

        GUIHelp.open();
    }

}

new Sample_MakePrefab().run();