type v2 = { x: number, y: number };
type v3 = { x: number, y: number, z: number };
type v4 = { x: number, y: number, z: number, w: number };
type rgb = { r: number, g: number, b: number };
type rgba = { r: number, g: number, b: number, a: number };
type rgbe = { r: number, g: number, b: number, e: number };
type rect = { x: number, y: number, width: number, height: number };

export type SerializeProtoType =
    'v4' | 'v3' | 'v2' | 'vn'
    | 'rgba' | 'rgb' | 'rgbe'
    | 'range' | 'rect';

export class SerializeProtoData {
    public readonly type?: SerializeProtoType;
    public data?: number[];

    constructor(type?: SerializeProtoType) {
        this.type = type;
    }

    public static writeVector4(value: v4): SerializeProtoData {
        let ret = new SerializeProtoData('v4');
        let floats = ret.data = [];
        floats[0] = value.x;
        floats[1] = value.y;
        floats[2] = value.z;
        floats[3] = value.w;
        return ret;
    }

    public static readVector4(value: SerializeProtoData, ret: v4): v4 {
        ret.x = value.data[0];
        ret.y = value.data[1];
        ret.z = value.data[2];
        ret.w = value.data[3];
        return ret;
    }

    public static writeVector3(value: v3): SerializeProtoData {
        let ret = new SerializeProtoData('v3');
        let floats = ret.data = [];
        floats[0] = value.x;
        floats[1] = value.y;
        floats[2] = value.z;
        return ret;
    }

    public static readVector3(value: SerializeProtoData, ret: v3): v3 {
        ret.x = value.data[0];
        ret.y = value.data[1];
        ret.z = value.data[2];
        return ret;
    }

    public static writeVector2(value: v2): SerializeProtoData {
        let ret = new SerializeProtoData('v2');
        let floats = ret.data = [];
        floats[0] = value.x;
        floats[1] = value.y;
        return ret;
    }

    public static readVector2(value: SerializeProtoData, ret: v2): v2 {
        ret.x = value.data[0];
        ret.y = value.data[1];
        return ret;
    }

    public static writeRGB(value: rgb): SerializeProtoData {
        let ret = new SerializeProtoData('rgb');
        let floats = ret.data = [];
        floats[0] = value.r;
        floats[1] = value.g;
        floats[2] = value.b;
        return ret;
    }

    public static readRGB(value: SerializeProtoData, ret: rgb): rgb {
        ret.r = value.data[0];
        ret.g = value.data[1];
        ret.b = value.data[2];
        return ret;
    }

    public static writeRGBA(value: rgba): SerializeProtoData {
        let ret = new SerializeProtoData('rgba');
        let floats = ret.data = [];
        floats[0] = value.r;
        floats[1] = value.g;
        floats[2] = value.b;
        floats[3] = value.a;
        return ret;
    }

    public static readRGBA(value: SerializeProtoData, ret: rgba): rgba {
        ret.r = value.data[0];
        ret.g = value.data[1];
        ret.b = value.data[2];
        ret.a = value.data[3];
        return ret;
    }

    public static writeFloat32Array(value: Float32Array | number[]): SerializeProtoData {
        let ret = new SerializeProtoData('vn');
        let floats = ret.data = [];
        for (let i of value) {
            floats.push(i);
        }
        return ret;
    }

    public static readFloat32Array(value: SerializeProtoData, ret: Float32Array | number[]): void {
        for (let i = 0, c = value.data.length; i < c; i++) {
            ret[i] = value.data[i];
        }
    }

    public static writeRGBE(value: rgbe): SerializeProtoData {
        let ret = new SerializeProtoData('rgbe');
        let floats = ret.data = [];
        floats[0] = value.r;
        floats[1] = value.g;
        floats[2] = value.b;
        floats[3] = value.e;
        return ret;
    }

    public static readRGBE(value: SerializeProtoData, ret: rgbe): rgbe {
        ret.r = value.data[0];
        ret.g = value.data[1];
        ret.b = value.data[2];
        ret.e = value.data[3];
        return ret;
    }

    public static writeRect(value: rect): SerializeProtoData {
        let ret = new SerializeProtoData('rect');
        let floats = ret.data = [];
        floats[0] = value.x;
        floats[1] = value.y;
        floats[2] = value.width;
        floats[3] = value.height;
        return ret;
    }

    public static readRect(value: SerializeProtoData, ret: rect): rect {
        ret.x = value.data[0];
        ret.y = value.data[1];
        ret.width = value.data[2];
        ret.height = value.data[3];
        return ret;
    }

    public static writeRange(value: number, min: number, max: number): SerializeProtoData {
        let ret = new SerializeProtoData('range');
        let floats = ret.data = [];
        floats[0] = value;
        floats[1] = min;
        floats[2] = max;
        return ret;
    }

}