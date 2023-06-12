import { Texture, MaterialBase, GeometryBase, Object3D } from "@orillusion/core";
import { SerializeData } from "../SerializeData";

export class UnSerializeData {
    textureList: Texture[] = [];
    materials: MaterialBase[] = [];
    geometries: GeometryBase[] = [];
    prefabData: SerializeData;
    object3DList: Object3D[] = [];
}