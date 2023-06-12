import {
    AtmosphericScatteringSky,
    Color,
    ComponentBase,
    DepthOfFieldPost,
    Engine3D,
    EngineSetting,
    ForwardRenderJob,
    GTAOPost,
    GeometryBase,
    GlobalFog,
    HDRBloomPost,
    MaterialBase,
    Object3D,
    OutlinePost,
    ParserBase,
    SSRPost,
    Scene3D,
    SolidColorSky,
    TAAPost,
    Texture,
    View3D,
    materialNameToClass,
} from '@orillusion/core';

import { VideoTexture } from '@orillusion/media-extention';
import { SerializeComponentBase } from '../SerializeData';
import { SerializeProtoData } from '../SerializeProtoData';
import { UnSerializeData } from './UnSerializeData';
import { UnSerializationUtil } from './UnSerializationUtil';
import { SerializationTypes } from '../SerializationTypes';

export class PrefabLoader extends ParserBase {
    static format: string = 'text';

    public assets: UnSerializeData;

    /**
     * 验证解析有效性
     * @param ret
     * @returns
     */
    verification(): boolean {
        if (this.data) {
            return true;
        } else {
            throw new Error('Method not implemented.');
        }
    }

    async parseString(data: string) {
        SerializationTypes.registerAll();
        this.assets = new UnSerializeData();
        this.assets.prefabData = JSON.parse(data);
        await this.parsePrefabRef();
        await this.parseGLTFs();
        await this.parseTextures();
        this.parseMaterials();
        this.parseGeometries();
        this.parseHierarchy();
        this.parseViewList();
    }

    private async parsePrefabRef() {
        let prefabList = this.assets.prefabData.prefabList;
        if (prefabList && prefabList.length > 0) {
            for (const url of prefabList) {
                await Engine3D.res.loadPrefab(url, PrefabLoader);
            }
        }
    }

    private async parseGLTFs() {
        let gltfList = this.assets.prefabData.gltfList;
        if (gltfList && gltfList.length > 0) {
            for (let url of gltfList) {
                await Engine3D.res.loadGltf(url);
            }
        }
    }

    private textureMap: { [key: string]: Texture };

    private async parseTextures() {
        this.textureMap = {};
        for (let item of this.assets.prefabData.textures) {
            let texture: Texture;
            let textureKey = item.asset;
            switch (item.asset.type) {
                case 'default':
                    texture = Engine3D.res.getTexture(item.name);
                    break;
                // case 'cube-atmospheric':
                // internal
                //     texture = new AtmosphericScatteringSky(item.data as any);
                //     break;
                case 'cube-solid-color': {
                    let color: Color = new Color();
                    SerializeProtoData.readRGBA(item.data, color);
                    texture = new SolidColorSky(color);
                    break;
                }
                case 'hdr-net-image': {
                    let uri: string = textureKey.url as string;
                    texture = await Engine3D.res.loadHDRTexture(uri);
                    this.textureMap[uri] = texture;
                    break;
                }
                case 'cube-hdr': {
                    let uri: string = textureKey.url as string;
                    texture = await Engine3D.res.loadHDRTextureCube(uri);
                    this.textureMap[uri] = texture;
                    break;
                }
                case 'cube-ldr': {
                    let uri: string = textureKey.url as string;
                    texture = await Engine3D.res.loadLDRTextureCube(uri);
                    this.textureMap[uri] = texture;
                    break;
                }
                case 'cube-std': {
                    let uri: string = textureKey.url as string;
                    texture = await Engine3D.res.loadTextureCubeStd(uri);
                    this.textureMap[uri] = texture;
                    break;
                }
                case 'cube-face6': {
                    let uris: string[] = textureKey.url as string[];
                    texture = await Engine3D.res.loadTextureCubeMaps(uris);
                    this.textureMap[uris[0]] = texture;
                    break;
                }
                case 'net-image': {
                    let uri: string = textureKey.url as string;
                    texture = await Engine3D.res.loadTexture(uri, null, item.flipY);
                    this.textureMap[uri] = texture;
                    break;
                }
                case 'video': {
                    let uri: string = textureKey.url as string;
                    let texture = new VideoTexture();
                    await texture.load(uri);
                    this.textureMap[uri] = texture;
                    break;
                }
                case 'glb-image': {
                    break;
                }
            }
            if (texture) {
                if (item.asset.type != 'default') {
                    UnSerializationUtil.unSerialize(texture, item, this.assets);
                }
                this.assets.textureList.push(texture);
            } else {
                console.warn('serialize texture', item.name);
            }
        }
    }

    private parseMaterials(): void {
        for (let item of this.assets.prefabData.materials) {
            let materialClass = materialNameToClass.get(item.className);
            let material: MaterialBase;

            if (materialClass) {
                material = new materialClass();
            } else {
                throw new Error('un support material: vs' + item.vsShader + ' fs:' + item.fsShader);
            }
            UnSerializationUtil.unSerialize(material, item, this.assets);
            this.assets.materials.push(material);
        }
    }

    private parseGeometries(): void {
        let serializeAble = SerializationTypes.getSerializeByName('GeometryBase');
        for (let item of this.assets.prefabData.geometries) {
            let geometry: GeometryBase = serializeAble.unSerialize(null, item, this.assets);
            this.assets.geometries.push(geometry);
        }
    }

    private parseHierarchy() {
        //create object3D
        let node: Object3D;
        for (let item of this.assets.prefabData.hierarchy) {
            if (item.isScene3D) {
                node = new Scene3D();
            } else {
                if (item.prefabRef) {
                    node = Engine3D.res.getPrefab(item.prefabRef).clone();
                } else {
                    node = new Object3D();
                }
            }
            UnSerializationUtil.unSerialize(node, item, this.assets);
            if (item.index == 0) {
                this.data = node;
            }
            this.assets.object3DList.push(node);

        }

        //build hierarchy
        for (let item of this.assets.prefabData.hierarchy) {
            let parent = this.assets.object3DList[item.index];
            if (parent && item.children && item.children.length > 0) {
                for (let i of item.children) {
                    parent.addChild(this.assets.object3DList[i]);
                }
            }
        }

        //build component
        for (let item of this.assets.prefabData.hierarchy) {
            let node = this.assets.object3DList[item.index];
            for (let component of item.components) {
                this.parseComponent(node, component);
            }
        }

    }

    private parseComponent(owner: Object3D, componentData: SerializeComponentBase) {
        let componentBase: ComponentBase;
        let cls = SerializationTypes.getClass(componentData.componentType);
        if (cls) {
            componentBase = owner.getOrAddComponent(cls);
            UnSerializationUtil.unSerialize(componentBase, componentData, this.assets);
        }
    }

    private parseViewList() {
        let viewList: View3D[] = this.assets.view3DList = [];
        let sourceList = this.assets.prefabData.view3DList;
        if (sourceList) {
            for (let item of sourceList) {
                let view3D = UnSerializationUtil.unSerialize(new View3D(), item, this.assets) as View3D;
                viewList.push(view3D);
            }
        }
    }

    public applyEngineSetting(instance: EngineSetting) {
        let serializeData = this.assets.prefabData.engineSetting as EngineSetting;
        if (serializeData) {
            UnSerializationUtil.serialization2(instance.shadow, serializeData.shadow, this.assets);
            UnSerializationUtil.serialization2(instance.gi, serializeData.gi, this.assets);
            UnSerializationUtil.serialization2(instance.sky, serializeData.sky, this.assets);
            UnSerializationUtil.serialization2(instance.light, serializeData.light, this.assets);
        }
    }

    public applyPostEffects(renderJob: ForwardRenderJob) {
        let config: EngineSetting = this.assets.prefabData.engineSetting;
        if (!renderJob || !config)
            return;
        let postProcessing = config.render.postProcessing;
        //ssr
        if (postProcessing.ssr.enable) {
            let ssrPost = new SSRPost();
            ssrPost.fadeEdgeRatio = postProcessing.ssr.fadeEdgeRatio;
            ssrPost.rayMarchRatio = postProcessing.ssr.rayMarchRatio;
            ssrPost.fadeDistanceMin = postProcessing.ssr.fadeDistanceMin;
            ssrPost.fadeDistanceMax = postProcessing.ssr.fadeDistanceMax;
            ssrPost.roughnessThreshold = postProcessing.ssr.roughnessThreshold;
            ssrPost.powDotRN = postProcessing.ssr.powDotRN;
            renderJob.addPost(ssrPost);
        }
        //taa
        if (postProcessing.taa.enable) {
            let taaPost = new TAAPost();
            taaPost.blendFactor = postProcessing.taa.blendFactor;
            taaPost.sharpFactor = postProcessing.taa.sharpFactor;
            taaPost.sharpPreBlurFactor = postProcessing.taa.sharpPreBlurFactor;
            taaPost.temporalJitterScale = postProcessing.taa.temporalJitterScale;
            taaPost.jitterSeedCount = postProcessing.taa.jitterSeedCount;
            renderJob.addPost(taaPost);
        }
        //gtao
        if (postProcessing.gtao.enable) {
            let gtaoPost = new GTAOPost();
            gtaoPost.maxPixel = postProcessing.gtao.maxPixel;
            gtaoPost.maxDistance = postProcessing.gtao.maxDistance;
            gtaoPost.darkFactor = postProcessing.gtao.darkFactor;
            gtaoPost.blendColor = postProcessing.gtao.blendColor;
            gtaoPost.multiBounce = postProcessing.gtao.multiBounce;
            gtaoPost.rayMarchSegment = postProcessing.gtao.rayMarchSegment;
            gtaoPost.usePosFloat32 = postProcessing.gtao.usePosFloat32;
            renderJob.addPost(gtaoPost);
        }
        //fog
        if (postProcessing.globalFog.enable) {
            let fogPost = new GlobalFog();
            fogPost.ins = postProcessing.globalFog.ins;
            fogPost.end = postProcessing.globalFog.end;
            let fogColor = postProcessing.globalFog.fogColor;
            fogPost.fogColor = new Color(fogColor.r, fogColor.g, fogColor.b, fogColor.a);
            fogPost.height = postProcessing.globalFog.height;
            fogPost.density = postProcessing.globalFog.density;
            fogPost.fogType = postProcessing.globalFog.fogType;
            fogPost.start = postProcessing.globalFog.start;
            renderJob.addPost(fogPost);
        }

        //depthofview
        if (postProcessing.depthOfView.enable) {
            let depthOfViewPost = new DepthOfFieldPost();
            depthOfViewPost.near = postProcessing.depthOfView.near;
            depthOfViewPost.far = postProcessing.depthOfView.far;
            // depthOfViewPost.iterationCount = postProcessing.depthOfView.iterationCount;
            depthOfViewPost.pixelOffset = postProcessing.depthOfView.pixelOffset;
            renderJob.addPost(depthOfViewPost);
        }
        //bloom
        if (postProcessing.bloom.enable) {
            let bloomPost = new HDRBloomPost();
            bloomPost.blurX = postProcessing.bloom.blurX;
            bloomPost.blurY = postProcessing.bloom.blurY;
            bloomPost.strength = postProcessing.bloom.strength;
            bloomPost.luminosityThreshold = postProcessing.bloom.luminosityThreshold;
            bloomPost.radius = postProcessing.bloom.radius;
            // bloomPost.bloomRadius = postProcessing.bloom.intensity;
            //todo bloom param
            renderJob.addPost(bloomPost);
        }
        //outline
        if (postProcessing.outline.enable) {
            let outlinePost = new OutlinePost();
            outlinePost.outlinePixel = postProcessing.outline.outlinePixel;
            outlinePost.fadeOutlinePixel = postProcessing.outline.fadeOutlinePixel;
            outlinePost.useAddMode = postProcessing.outline.useAddMode;
            outlinePost.strength = postProcessing.outline.strength;
            // outlinePost.groupCount = postProcessing.outline.groupCount;
            renderJob.addPost(outlinePost);
        }
    }

}
