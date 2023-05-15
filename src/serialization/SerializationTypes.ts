import { Color, Rect, Vector2, Vector3, Vector4 } from "..";

export let SerializationFilter: { [type: string]: any } = {
    String: String,
    Number: Number,
    Boolean: Boolean,
    Vector2: Vector2,
    Vector3: Vector3,
    Vector4: Vector4,
    Color: Color,
    Rect: Rect,
}

export function SerializationCheck(params: any): boolean {
    let type = SerializationFilter[params.constructor.name];
    return type != null;
}

export function GetSerializationType(params: any): string {
    return params.constructor.name;
}