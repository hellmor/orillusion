import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { OriMapper } from "@samples/animation/OrillusionMorphMapper";

// @ts-ignore
import { Peer } from 'https://esm.sh/peerjs';
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { Scene3D, MorphTargetBlender, MorphTargetFrame, Engine3D, Object3D, Vector3, Entity } from "@orillusion/core";

export class Sample_MorphTargetFace {
    scene: Scene3D;
    blender: MorphTargetBlender;
    frameData: MorphTargetFrame;

    genPearID(): string {
        let source = '123456789';
        let dst = ''
        for (let i = 0; i < 4; i++) {
            let char = source.charAt(Math.floor(Math.random() * 9));
            dst += char;
        }
        return dst;
    }
    async run() {
        let that = this;
        var id = this.genPearID();
        let peer = new Peer(id, {
            config: {
                iceServers: [
                    { url: 'stun:stun.qq.com:3478' },
                    { url: 'stun:stun.miwifi.com:3478' },
                    { url: 'stun:stun.l.google.com:19302' }
                ]
            },
            host: 'peer.dolphinbi.com', port: 443, path: '/peerSync', secure: true
        })
        peer.on('open', (id) => {
            console.warn('server open:', id);
        })
        peer.on('connection', c => {
            console.warn('new client', c.peer)
            c.on('data', async e => {
                that.frameData = JSON.parse(e);
            })
            c.on('close', () => {
                console.warn('closed', c.peer)
            })
        })
        GUIHelp.init();
        GUIHelp.addLabel(id, 'Pear ID');
        GUIHelp.open();

        await Engine3D.init({ beforeRender: () => this.loop() });

        Engine3D.setting.shadow.shadowBound = 50;
        Engine3D.setting.shadow.shadowBias = 0.0001;

        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;

        let sceneParam = createSceneParam();
        sceneParam.camera.pitch = 0;
        sceneParam.camera.roll = 0;
        sceneParam.camera.distance = 100;
        let exampleScene = createExampleScene(sceneParam);
        this.scene = exampleScene.scene;
        await this.initMorphModel();

        Engine3D.startRenderView(exampleScene.view);
    }

    private influenceData: { [key: string]: number } = {};

    private player: Object3D;
    private face: Object3D;
    private playerScale: number = 100;

    private async initMorphModel() {
        this.player = await Engine3D.res.loadGltf('morph/nanhai/nanhai.gltf');
        this.player.localScale = new Vector3(this.playerScale, this.playerScale, this.playerScale);
        this.face = this.player.entityChildren[0] as Object3D;

        this.scene.addChild(this.player);
        this.player.y = -50;
        GUIHelp.add(this.face, 'y', -2, 1, 0.01);

        this.blender = this.player.addComponent(MorphTargetBlender);
        let targetRenderers = this.blender.cloneMorphRenderers();
        for (let item of [this.face]) {
            GUIHelp.addFolder(item.name)
            GUIHelp.add(item.transform, 'rotationX', -80, 80, 1);
            GUIHelp.add(item.transform, 'rotationY', -80, 80, 1);
            GUIHelp.add(item.transform, 'rotationZ', -80, 80, 1);
            GUIHelp.endFolder();
        }
        GUIHelp.addFolder('morph controller');
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

        this.printHierarcy(this.player);
        GUIHelp.endFolder();
    }

    private printHierarcy(obj: Entity, pre: string = '') {
        console.log(pre, obj.name);

        pre += '-';
        for (let child of obj.entityChildren) {
            this.printHierarcy(child, pre);
        }
    }

    loop() {
        if (this.blender && this.frameData) {
            this.blender.applyBlendShape(this.frameData, OriMapper, this.playerScale);
        }
    }
}
