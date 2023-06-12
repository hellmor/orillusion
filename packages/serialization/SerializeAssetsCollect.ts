import { Engine3D, GeometryBase, MaterialBase, MeshRenderer, Object3D, RenderNode, SkyRenderer, Texture } from "@orillusion/core";
import { ISerializeAssetsCollect } from "./ISerializeAssetsCollect";
import { SerializeTextureInstance, SerializeMaterialInstance, SerializeGeometryInstance } from "./SerializeAssetInstance";
import { SerializeIndex } from "./SerializeData";
import { SerializationUtil } from "./SerializationUtil";
import { TextureAsset } from "../../src/gfx/graphics/webGpu/core/texture/TextureAsset";


export class SerializeAssetsCollect implements ISerializeAssetsCollect {
    private refTextures: Map<Texture, SerializeTextureInstance>;
    private refMaterials: Map<MaterialBase, SerializeMaterialInstance>;
    // private refShaders: Map<Shader, SerializeShaderInstance>;
    private refGeometries: Map<GeometryBase, SerializeGeometryInstance>;

    public retTextures: SerializeTextureInstance[];
    public retMaterials: SerializeMaterialInstance[];
    public retGeometries: SerializeGeometryInstance[];

    public collect(object3D: Object3D) {

        this.refTextures = new Map<Texture, SerializeTextureInstance>;
        this.refMaterials = new Map<MaterialBase, SerializeMaterialInstance>;
        // this.refShaders = new Map<Shader, SerializeShaderInstance>;
        this.refGeometries = new Map<GeometryBase, SerializeGeometryInstance>;

        if (object3D.isScene3D) {
            // let skyRenderer = object3D['skyRender'] as SkyRenderer;
            // this.refGeometries.set(skyRenderer.geometry, null);
            // this.refTextures.set(skyRenderer.map, null);
        }

        this.collectAssetsOfObject3D(object3D);
        this.makeInstanceOfAssets();
        this.removeNullAssetInstance();
        this.getAssetsInstanceList();
        this.linkTextureToMaterial();
    }

    private collectAssetsOfObject3D(object3D: Object3D): void {
        //render node
        object3D.components.forEach((v) => {
            // if (v.serializeTag != "dont-serialize") {
            if (v instanceof MeshRenderer || v instanceof RenderNode) {
                let geometry = v.geometry;
                if (geometry) {
                    this.refGeometries.set(v.geometry, null);
                    for (let material of v.materials) {
                        this.refMaterials.set(material, null);
                    }
                } else {
                    // console.log(v);
                }
            }
            // }
        })

        //children
        if (object3D.serializeTag != "only-self" && !object3D.prefabRef) {
            if (object3D.entityChildren.length > 0) {
                for (const child of object3D.entityChildren) {
                    if (child instanceof Object3D) {
                        if (child.serializeTag != 'dont-serialize') {
                            this.collectAssetsOfObject3D(child);
                        }
                    }
                }
            }
        }
    }

    private makeInstanceOfAssets(): void {
        //material
        let material_list: MaterialBase[] = [];
        this.refMaterials.forEach((v, k) => {
            material_list.push(k);
        })
        material_list.forEach((v) => {
            let instance: SerializeMaterialInstance = SerializationUtil.serialization(v, this);
            this.refMaterials.set(v, instance);

            //collect textures
            instance.textures = {};
            let textures = v.renderShader.textures;
            for (const attribute in textures) {
                let texture = textures[attribute];
                this.refTextures.set(texture, null);
            }
        });

        //texture
        let texture_list: Texture[] = [];
        this.refTextures.forEach((v, k) => {
            texture_list.push(k);
        })

        texture_list.forEach((v) => {
            let defaultTexture = Engine3D.res.isDefaultTexture(v.name);
            if (defaultTexture) {
                defaultTexture.asset ||= new TextureAsset().setDefault();
            }
            let instance: SerializeTextureInstance = SerializationUtil.serialization(v, this);
            if (instance) {
                this.refTextures.set(v, instance);
            }
        })

        //geometry
        let geometry_list: GeometryBase[] = [];
        this.refGeometries.forEach((v, k) => {
            geometry_list.push(k);
        })
        geometry_list.forEach((geometry) => {
            let instance: SerializeGeometryInstance = SerializationUtil.serialization(geometry, this);
            this.refGeometries.set(geometry, instance);
        })
    }

    private removeNullAssetInstance(): void {
        //material
        let refMaterialsNew: Map<MaterialBase, SerializeMaterialInstance> = new Map<MaterialBase, SerializeMaterialInstance>();
        this.refMaterials.forEach((v, k) => {
            if (v) refMaterialsNew.set(k, v);
        })
        this.refMaterials = refMaterialsNew;

        //texture
        let refTexturesNew: Map<Texture, SerializeTextureInstance> = new Map<Texture, SerializeTextureInstance>();
        this.refTextures.forEach((v, k) => {
            if (v) refTexturesNew.set(k, v);
        })
        this.refTextures = refTexturesNew;

        //geometry
        let refGeometryNew: Map<GeometryBase, SerializeGeometryInstance> = new Map<GeometryBase, SerializeGeometryInstance>();
        this.refGeometries.forEach((v, k) => {
            if (v) refGeometryNew.set(k, v);
        })
        this.refGeometries = refGeometryNew;
    }


    private getAssetsInstanceList(): void {
        this.retMaterials = [];
        this.retTextures = [];
        this.retGeometries = [];

        let refList: Map<any, SerializeIndex>[] = [this.refMaterials, this.refTextures, this.refGeometries] as any;
        let retList = [this.retMaterials, this.retTextures, this.retGeometries];

        for (let i = 0, c = retList.length; i < c; i++) {
            let list = retList[i] as SerializeIndex[];
            let index: number = 0;
            refList[i].forEach((sIndex, v) => {
                sIndex.index = index++;
                list.push(sIndex);
            })
        }

    }

    private linkTextureToMaterial() {
        this.refMaterials.forEach((v, k) => {
            let textures = k.renderShader.textures;
            for (const attribute in textures) {
                let texture = textures[attribute];
                let textureInstanceName = this.getTextureIndex(texture);
                if (textureInstanceName >= 0) {
                    v.textures[attribute] = textureInstanceName;
                }
            }
        })
    }

    getGeometryIndex(geometry: GeometryBase): number {
        if (!geometry) return null;
        let instance = this.refGeometries.get(geometry);
        return instance ? instance.index : -1;
    }

    getMaterialIndex(material: MaterialBase): number {
        if (!material) return null;
        let instance = this.refMaterials.get(material);
        return instance ? instance.index : -1;
    }

    getTextureIndex(texture: Texture): number {
        if (!texture) return null;
        let instance = this.refTextures.get(texture);
        return instance ? instance.index : -1;
    }

}