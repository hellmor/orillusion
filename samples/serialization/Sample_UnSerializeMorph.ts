import { Engine3D, MorphTargetBlender, Scene3D } from '@orillusion/core';
import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { PrefabLoader } from '@orillusion/serialization/unSerialize/PrefabLoader';

class Sample_UnSerializeMorph {
    private scene: Scene3D;
    async run() {
        await Engine3D.init();

        GUIHelp.init();

        GUIHelp.addButton('Load Prefab(Morph)', () => {
            this.loadPrefab();
        })
        GUIHelp.open();
    }

    private blender: MorphTargetBlender;
    private influenceData: { [key: string]: number } = {};

    private async loadPrefab() {
        const url = 'prefab/nanhai.json';

        this.scene = await Engine3D.res.loadPrefab(url, PrefabLoader) as Scene3D;
        let loader = Engine3D.res.getPrefabLoader(url) as PrefabLoader;
        loader.applyEngineSetting(Engine3D.setting);
        let views = loader.assets.view3DList;
        Engine3D.startRenderViews(views);

        let renderJob = Engine3D.getRenderJob(views[0]);
        loader.applyPostEffects(renderJob);

        this.blender = this.scene.getComponentsExt(MorphTargetBlender)[0];
        let targetRenderers = this.blender.cloneMorphRenderers();

        GUIHelp.addFolder('Morph Controller');
        for (let key in targetRenderers) {
            this.influenceData[key] = 0.0;
            GUIHelp.add(this.influenceData, key, 0, 1, 0.01).onChange((v) => {
                this.influenceData[key] = v;
                let list = this.blender.getMorphRenderersByKey(key);
                for (let renderer of list) {
                    renderer.setMorphInfluence(key, v);
                }
            });
        }
        GUIHelp.open();
    }
}

new Sample_UnSerializeMorph().run();