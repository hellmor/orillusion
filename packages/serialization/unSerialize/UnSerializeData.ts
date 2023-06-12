import { Texture, MaterialBase, GeometryBase, Object3D, Scene3D, View3D, Camera3D } from "@orillusion/core";
import { SerializeData } from "../SerializeData";

export class UnSerializeData {
    textureList: Texture[] = [];
    materials: MaterialBase[] = [];
    geometries: GeometryBase[] = [];
    prefabData: SerializeData;
    object3DList: Object3D[] = [];
    view3DList?: View3D[];
    cameras: Camera3D[] = [];
    scene?: Scene3D;
}