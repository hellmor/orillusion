export type GeometryAssetType = 'obj' | 'gltf' | 'glb';
export class GeometryAsset {
    public type: GeometryAssetType;
    public data?: any;
    public file?: string;

    setObjGeometry(url: string, value: string): this {
        this.type = "obj";
        this.file = url;
        this.data = value;
        return this;
    }

    setGLTFGeometry(gltf: string, value: string): this {
        this.type = 'gltf';
        this.file = gltf;
        this.data = value;
        return this;
    }

    setGLBGeometry(glb: string, value: number): this {
        this.type = "glb";
        this.data = value;
        this.file = glb;
        return this;
    }
}