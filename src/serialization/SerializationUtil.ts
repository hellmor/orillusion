import { GetSerializationType, SerializationCheck } from "./SerializationTypes";

export class SerializationUtil {
    public static serialization_Boolean(source: any, property: string, out: any) {
        out[source.constructor.name] ||= {};
        out[source.constructor.name][property] = source[property];
    }

    public static serialization_Number(source: any, property: string, out: any) {
        out[source.constructor.name] ||= {};
        out[source.constructor.name][property] = source[property];
    }

    public static serialization_String(source: any, property: string, out: any) {
        out[source.constructor.name] ||= {};
        out[source.constructor.name][property] = source[property];
    }

    public static serialization_Vector2(source: any, property: string, out: any) {
        out[source.constructor.name] ||= {};
        out[source.constructor.name][property] ||= {};
        out[source.constructor.name][property].x = source[property].x;
        out[source.constructor.name][property].y = source[property].y;
    }

    public static serialization_Vector3(source: any, property: string, out: any) {
        out[source.constructor.name] ||= {};
        out[source.constructor.name][property] ||= {};
        out[source.constructor.name][property].x = source[property].x;
        out[source.constructor.name][property].y = source[property].y;
        out[source.constructor.name][property].z = source[property].z;
    }

    public static serialization_Branch(source: any, property: string, out: any) {
        if (SerializationCheck(source[property])) {
            let typeStr = GetSerializationType(source[property]);
            let fun = `serialization_${typeStr}`;
            if (fun in SerializationUtil) {
                SerializationUtil[fun](source, property, out);
            }
        } else {
            let obj = {};
            out[property] = obj;
            if (SerializationCheck(source[property])) {

            }
            SerializationUtil.serialization(source[property], obj);
        }
    }

    public static serialization(source: any, out?: any) {
        let obj = out ? out : {};
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                // const element = source[key];
                SerializationUtil.serialization_Branch(source, key, obj);
            }
        }
        return obj;
    }
}