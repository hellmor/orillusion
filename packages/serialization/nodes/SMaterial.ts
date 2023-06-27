import { MaterialBase, materialClassToName } from "@orillusion/core";
import { SerializeMaterialInstance } from "../SerializeAssetInstance";
import { UnSerializeData } from "../unSerialize/UnSerializeData";
import { SerializeAble } from "../SerializeData";
import { SerializeMaterialUniform } from "../SerializeMaterialUniform";
import { ISerializeAssetsCollect } from "../ISerializeAssetsCollect";

export class SMaterial extends SerializeAble {
    public serialize(target: any, assets: ISerializeAssetsCollect): SerializeMaterialInstance {
        let material = target as MaterialBase;
        let instance = new SerializeMaterialInstance();
        instance.name = material.name;
        instance.className = materialClassToName.get(material['constructor'] as any);
        instance.vsShader = material.renderShader.vsName;
        instance.fsShader = material.renderShader.fsName;
        instance.shaderState = material.renderShader.shaderState;
        instance.defineValue = material.renderShader.defineValue;
        instance.constValues = material.renderShader.constValues;

        instance.sort = material.sort;
        instance.transparent = material.transparent;
        instance.enable = material.enable;
        //collect uniform
        instance.uniforms = SerializeMaterialUniform.serialization(material);
        return instance;
    }

    public unSerialize(target: any, instance: SerializeMaterialInstance, data: UnSerializeData) {
        let material = target as MaterialBase;

        material.name = instance.name;
        for (let key in instance.defineValue) {
            material.renderShader.defineValue[key] = instance.defineValue[key];
        }
        for (let key in instance.constValues) {
            material.renderShader.constValues[key] = instance.constValues[key];
        }
        for (let key in instance.shaderState) {
            material.renderShader.shaderState[key] = instance.shaderState[key];
        }

        material.sort = instance.sort;
        material.transparent = instance.transparent;
        material.enable = instance.enable;
        //textures
        for (let key in instance.textures) {
            let index = instance.textures[key];
            let texture = data.textureList[index];
            material[key] = texture;
            // if (key == 'envMap') {
            //     material.renderShader.setTexture(`prefilterMap`, texture);
            // }
        }
        SerializeMaterialUniform.unSerialization(material, instance);
    }
}
