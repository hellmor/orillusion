export type GeometryAssetType = 'obj' | 'gltf';
export class GeometryAsset {
    public type: GeometryAssetType;
    public data?: any;
    public url?: string;

    setObj(url: string, data: string): this {
        this.type = "obj";
        this.url = url;
        this.data = data;
        return this;
    }

    setGLTF(url: string, data: string): this {
        this.type = 'gltf';//glb and gltf
        this.url = url;
        this.data = data;
        return this;
    }
}