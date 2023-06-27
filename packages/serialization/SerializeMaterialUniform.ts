
import { MaterialBase, Vector2, Vector3, Vector4, Color } from "@orillusion/core";
import { SerializeMaterialInstance } from "./SerializeAssetInstance";
import { SerializeProtoData } from "./SerializeProtoData";

export class SerializeMaterialUniform {
    public static serialization(material: MaterialBase): { [key: string]: SerializeProtoData | number | string } {
        let uniforms = material.renderShader.uniforms;
        let ret: { [key: string]: SerializeProtoData | number | string } = {};
        for (const attribute in uniforms) {
            let value = uniforms[attribute].data;
            let protoData: SerializeProtoData | number | string;

            if (value instanceof Vector2) {
                protoData = SerializeProtoData.writeVector2(value);
            } else if (value instanceof Vector3) {
                protoData = SerializeProtoData.writeVector3(value);
            } else if (value instanceof Vector4) {
                protoData = SerializeProtoData.writeVector4(value);
            } else if (value instanceof Color) {
                protoData = SerializeProtoData.writeRGBA(value);
            } else if (value instanceof Float32Array) {
                protoData = SerializeProtoData.writeFloat32Array(value);
                // } else if (value instanceof DDGIIrradianceVolume) {
                //     protoData = SerializeProtoData.writeNone();
            } else {
                protoData = value;
            }
            ret[attribute] = protoData;
        }
        return ret;
    }

    public static unSerialization(material: MaterialBase, item: SerializeMaterialInstance) {
        //uniforms
        for (let key in item.uniforms) {
            let data0 = item.uniforms[key];
            let t = typeof data0 as any;
            if (t != 'string' && t != 'number') {
                t = data0['type'];
            }
            let data = data0 as SerializeProtoData;
            switch (t) {
                case 'number':
                    material.renderShader.setUniformFloat(key, data0 as number);
                    break;
                case 'vn':
                    let float32Array = new Float32Array(data.data.length);
                    SerializeProtoData.readFloat32Array(data, float32Array);
                    break;
                case 'v4':
                    let vector4: Vector4 = new Vector4();
                    SerializeProtoData.readVector4(data, vector4);
                    material.renderShader.setUniformVector4(key, vector4);
                    break;
                case 'v3':
                    let vector3: Vector3 = new Vector3();
                    SerializeProtoData.readVector4(data, vector3);
                    material.renderShader.setUniformVector3(key, vector3);
                    break;
                case 'v2':
                    let vector2: Vector2 = new Vector2();
                    SerializeProtoData.readVector2(data, vector2);
                    material.renderShader.setUniformVector2(key, vector2);
                    break;
                case 'rgba':
                    let color: Color = new Color();
                    SerializeProtoData.readRGBA(data, color);
                    material.renderShader.setUniformColor(key, color);
                    break;
                case 'rgbe':
                    break;
                case 'rgb':
                    break;

                default:
                    console.log('default uniform:', key, data.type)
            }
        }
    }
}