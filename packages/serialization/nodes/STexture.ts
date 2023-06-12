import { Texture, LDRTextureCube, Depth2DTextureArray, AtmosphericScatteringSky, SolidColorSky, VirtualTexture } from "@orillusion/core";
import { SerializeTextureInstance } from "../SerializeAssetInstance";
import { SerializeProtoData } from "../SerializeProtoData";
import { SerializeAble } from "../SerializeData";
import { ISerializeAssetsCollect } from "../ISerializeAssetsCollect";

export class STexture implements SerializeAble {
    public serialize(texture: Texture, assets: ISerializeAssetsCollect): SerializeTextureInstance {
        let instance = new SerializeTextureInstance();
        instance.textureSource = texture.asset;
        instance.name = texture.name;
        instance.compare = texture.compare;
        instance.minFilter = texture.minFilter;
        instance.magFilter = texture.magFilter;
        instance.mipmapFilter = texture.mipmapFilter;
        instance.addressModeU = texture.addressModeU;
        instance.addressModeV = texture.addressModeV;
        instance.visibility = texture.visibility;
        instance.format = texture.format;
        instance.lodMinClamp = texture.lodMinClamp;
        instance.lodMaxClamp = texture.lodMaxClamp;
        instance.useMipmap = texture.useMipmap;

        instance.flipY = texture.flipY;

        return instance;
    }

    public unSerialize(texture: Texture, instance: SerializeTextureInstance) {

        texture.compare = instance.compare;
        texture.minFilter = instance.minFilter;
        texture.magFilter = instance.magFilter;
        texture.mipmapFilter = instance.mipmapFilter;
        texture.addressModeU = instance.addressModeU;
        texture.addressModeV = instance.addressModeV;
        // texture.visibility = instance.visibility;
        texture.format = instance.format;
        texture.lodMinClamp = instance.lodMinClamp;
        texture.lodMaxClamp = instance.lodMaxClamp;
        texture.useMipmap = instance.useMipmap;

        texture.flipY = instance.flipY;
    }
}


export class SLDRTextureCube extends STexture {

    public serialize(texture: LDRTextureCube, assets: ISerializeAssetsCollect): SerializeTextureInstance {
        let instance = super.serialize(texture, assets);
        instance.textureSource.setCubeLDR(texture.ldrImageUrl);
        return instance;
    }

}


export class SDepth2DTextureArray extends STexture {
    public serialize(target: any): SerializeTextureInstance {
        return null;
    }

}


export class SAtmosphericScatteringSky extends STexture {
    public serialize(target: AtmosphericScatteringSky, assets: ISerializeAssetsCollect): SerializeTextureInstance {
        let instance = super.serialize(target, assets);
        // instance.data = sky.setting;
        return instance;
    }

}


export class SSolidColorSky extends STexture {
    public serialize(target: SolidColorSky, assets: ISerializeAssetsCollect): SerializeTextureInstance {
        let instance = super.serialize(target, assets);
        instance.data = SerializeProtoData.writeRGBA(target.color);
        return instance;
    }

}

export class SVirtualTexture extends STexture {
    public serialize(target: any): SerializeTextureInstance {
        return null;
    }

}
