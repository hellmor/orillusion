import { GeometryAsset, MaterialClassName } from "@orillusion/core";
import { SerializeIndex } from "./SerializeData";
import { SerializeProtoData } from "./SerializeProtoData";
import { TextureAsset } from "../../src/gfx/graphics/webGpu/core/texture/TextureAsset";


export class SerializeGeometryInstance extends SerializeIndex {
    public className?: string;
    public asset?: GeometryAsset;
}

export class SerializeMaterialInstance extends SerializeIndex {
    public vsShader: string;
    public fsShader: string;
    public className: MaterialClassName;
    public textures: { [key: string]: number };
    public uniforms: { [key: string]: SerializeProtoData | number | string };
    public shaderState: any;
    public defineValue: { [name: string]: any };
    public constValues: { [name: string]: any };
}

export class SerializeTextureInstance extends SerializeIndex {
    public data?: any;
    public asset: TextureAsset;
    public compare: GPUCompareFunction;
    public minFilter: GPUFilterMode;
    public magFilter: GPUFilterMode;
    public mipmapFilter: GPUMipmapFilterMode;
    public addressModeU: GPUAddressMode;
    public addressModeV: GPUAddressMode;
    public visibility: number;
    public format: GPUTextureFormat;
    public lodMinClamp: number;
    public lodMaxClamp: number;
    public useMipmap: boolean;

    public flipY: boolean;
}