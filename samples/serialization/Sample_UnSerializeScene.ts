import { Engine3D, Entity, Scene3D } from '@orillusion/core';
import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { PrefabLoader } from '@orillusion/serialization/unSerialize/PrefabLoader';

class Sample_UnSerializeScene {
    private scene: Scene3D;
    async run() {
        await Engine3D.init();

        GUIHelp.init();

        GUIHelp.addButton('load prefab', () => {
            this.loadPrefab();
        })
        GUIHelp.open();
    }

    private async loadPrefab() {
        const url = 'prefab/test.json';

        this.scene = await Engine3D.res.loadPrefab(url, PrefabLoader) as Scene3D;
        let loader = Engine3D.res.getPrefabLoader(url) as PrefabLoader;
        loader.applyEngineSetting(Engine3D.setting);
        let views = loader.assets.view3DList;
        Engine3D.startRenderViews(views);

        let renderJob = Engine3D.getRenderJob(views[0]);
        loader.applyPostEffects(renderJob);
        // this.printHierarchy(this.scene);
    }

    private printHierarchy(obj: Entity, path: string = '') {
        console.log(path, obj.name);

        path += '== ';
        for (let child of obj.entityChildren) {
            this.printHierarchy(child, path);
        }
    }
}

new Sample_UnSerializeScene().run();