import { ISerialization } from "./nodes/ISerialization";
import { SComponent } from "./nodes/SComponent";
import { SObject3D } from "./nodes/SObject3D";
import { STransform } from "./nodes/STransform";
import { SVector2D } from "./nodes/SVector2D";
import { SVector3D } from "./nodes/SVector3D";

export class SerializationTypes {
    private static _register: Map<string, any>
    public static registerAll() {
        if (this._register == null) {
            this._register = new Map<string, any>();

            this._register.set("Vector2D", new SVector2D());
            this._register.set("Vector3D", new SVector3D());
            this._register.set("Transform", new STransform());

            this._register.set("Component", new SComponent());
            this._register.set("Object3D", new SObject3D());
        }
    }

    public static getSerializeClass(name: string): ISerialization {
        return this._register.get(name);
    }
}