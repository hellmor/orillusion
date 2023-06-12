export type TextureAssetType =
    'none'
    | 'default'
    | 'net-image' | 'hdr-net-image'
    | 'glb-image' | 'str-base64'
    | 'cube-hdr' | 'cube-ldr' | 'cube-std' | 'cube-face6'
    | 'cube-atmospheric' | 'cube-solid-color'
    | 'video';

export class TextureAsset {

    public type: TextureAssetType;
    public url?: string | string[];
    public index?: number | number[];
    public srcGLTF?: string;
    public srcGLB?: string;
    public base64?: string;

    setDefault(): this {
        this.type = 'default';
        return this;
    }

    setNetImage(url: string): this {
        this.type = "net-image";
        this.url = url;
        return this;
    }

    setHDRNetImage(url: string): this {
        this.type = "hdr-net-image";
        this.url = url;
        return this;
    }

    setImageBase64(base64: string): this {
        this.type = 'str-base64';
        this.base64 = base64;
        return this;
    }

    setGLBImage(glb: string, index: number): this {
        this.type = "glb-image";
        this.index = index;
        this.srcGLB = glb;
        return this;
    }

    setCubeStd(url: string): this {
        this.type = "cube-std";
        this.url = url;
        return this;
    }

    setCubeLDR(url: string): this {
        this.type = 'cube-ldr';
        this.url = url;
        return this;
    }

    setCubeHDR(url: string): this {
        this.type = 'cube-hdr';
        this.url = url;
        return this;
    }

    setCubeFace6(url: string[]): this {
        this.type = 'cube-face6';
        this.url = url;
        return this;
    }

    setCubeAtmospheric(): this {
        this.type = "cube-atmospheric";
        return this;
    }

    setCubeSolidColor(): this {
        this.type = "cube-solid-color";
        return this;
    }

    setVideo(url: string): this {
        this.type = "video";
        return this;
    }
}