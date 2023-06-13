import { Texture, Depth2DTextureArray, AtmosphericScatteringSky, SolidColorSky, VirtualTexture, DepthCubeTexture, DepthCubeArrayTexture, Color } from "@orillusion/core";
import { SerializeTextureInstance } from "../SerializeAssetInstance";
import { SerializeProtoData } from "../SerializeProtoData";
import { SerializeAble } from "../SerializeData";
import { ISerializeAssetsCollect } from "../ISerializeAssetsCollect";
import { SerializationUtil } from "../SerializationUtil";
import { UnSerializationUtil } from "../unSerialize/UnSerializationUtil";
import { UnSerializeData } from "../unSerialize/UnSerializeData";

export class STexture implements SerializeAble {
    private static exludeTextures: any[];
    public serialize(texture: Texture, assets: ISerializeAssetsCollect): SerializeTextureInstance {

        if (STexture.exludeTextures == null) {
            STexture.exludeTextures = [];
            STexture.exludeTextures.push(DepthCubeTexture, Depth2DTextureArray, DepthCubeArrayTexture);
            STexture.exludeTextures.push(VirtualTexture, AtmosphericScatteringSky, Depth2DTextureArray);
        }

        let type = texture.constructor;
        if (STexture.exludeTextures.includes(type))
            return;

        let instance = new SerializeTextureInstance();
        SerializationUtil.serialization2(texture, assets, instance);
        instance.compare = texture.compare;
        instance.minFilter = texture.minFilter;
        instance.magFilter = texture.magFilter;
        instance.mipmapFilter = texture.mipmapFilter;
        instance.addressModeU = texture.addressModeU;
        instance.addressModeV = texture.addressModeV;
        instance.lodMinClamp = texture.lodMinClamp;
        instance.lodMaxClamp = texture.lodMaxClamp;
        instance.useMipmap = texture.useMipmap;
        instance.asset = texture.asset;

        // instance.asset = texture.asset;
        // instance.name = texture.name;
        // instance.visibility = texture.visibility;
        // instance.format = texture.format;
        // instance.flipY = texture.flipY;

        return instance;
    }

    public unSerialize(texture: Texture, instance: SerializeTextureInstance, asset: UnSerializeData): Texture {

        UnSerializationUtil.unSerialize2(texture, instance, asset)

        texture.compare = instance.compare;
        texture.minFilter = instance.minFilter;
        texture.magFilter = instance.magFilter;
        texture.mipmapFilter = instance.mipmapFilter;
        texture.addressModeU = instance.addressModeU;
        texture.addressModeV = instance.addressModeV;
        texture.lodMinClamp = instance.lodMinClamp;
        texture.lodMaxClamp = instance.lodMaxClamp;
        texture.useMipmap = instance.useMipmap;
        texture.asset = instance.asset;
        return texture;
    }
}

export class SSolidColorSky extends STexture {
    public serialize(target: SolidColorSky, assets: ISerializeAssetsCollect): SerializeTextureInstance {
        let instance = super.serialize(target, assets);
        instance.data = SerializeProtoData.writeRGBA(target.color);
        return instance;
    }

    public unSerialize1(texture: SolidColorSky, instance: SerializeTextureInstance, asset: UnSerializeData): SolidColorSky {
        super.unSerialize(texture, instance, asset);
        texture.color = SerializeProtoData.readRGBA(instance.data, new Color()) as Color;
        return texture;
    }
}
