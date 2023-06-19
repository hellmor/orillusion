import { AtmosphericComponent, Camera3D, ColliderComponent, Color, ComponentBase, DirectLight, GeometryBase, HoverCameraController, LightBase, MaterialBase, MeshRenderer, MorphTargetBlender, Object3D, PointLight, RenderNode, Scene3D, SkyRenderer, SolidColorSky, SpotLight, Texture, Transform, Vector2, Vector3, Vector4, View3D, } from "@orillusion/core";
import { SObject3D, SScene3D } from "./nodes/SObject3D";
import { STransform } from "./nodes/component/STransform";
import { SVector2D } from "./nodes/SVector2D";
import { SVector3D } from "./nodes/SVector3D";
import { SerializeAble } from "./SerializeData";
import { SMaterial } from "./nodes/SMaterial";
import { SGeometryBase } from "./nodes/SGeometry";
import { SSolidColorSky, STexture } from "./nodes/STexture";
import { SCamera3D } from "./nodes/component/SCamera3D";
import { SVector4D } from "./nodes/SVector4D";
import { SComponentBase } from "./nodes/component/SComponentBase";
import { SRenderNode, SMeshRenderer, SSkyRenderer, SAtmosphericComponent } from "./nodes/component/SRenderNode";
import { SDirectLight, SSpotLight, SPointLight, SLightBase } from "./nodes/component/SLightBase";
import { SColliderComponent } from "./nodes/component/SColliderComponent";
import { SView3D } from "./nodes/SView3D";
import { SColor } from "./nodes/SColor";

export class SerializationTypes {
    private static _nameToSerializeClass: Map<string, any>;
    private static _nameToClass: Map<string, any>;
    public static registerAll() {
        if (!this._nameToSerializeClass) {
            this._nameToSerializeClass = this.doRegister();
        }
    }

    private static doRegister(): Map<string, any> {
        this._nameToSerializeClass = new Map<string, any>();
        this._nameToClass = new Map<string, any>();
        //node
        this.register("Object3D", Object3D, new SObject3D());
        this.register("Scene3D", Scene3D, new SScene3D());

        //component
        this.registerComponent("ComponentBase", ComponentBase);
        this.registerComponent("HoverCameraController", HoverCameraController);
        this.registerComponent("MorphTargetBlender", MorphTargetBlender);

        this.register("Transform", Transform, new STransform());
        this.register("Camera3D", Camera3D, new SCamera3D());
        this.register("RenderNode", RenderNode, new SRenderNode());

        this.register("MeshRenderer", MeshRenderer, new SMeshRenderer());
        this.register("SkyRenderer", SkyRenderer, new SSkyRenderer());
        this.register("AtmosphericComponent", AtmosphericComponent, new SAtmosphericComponent());

        this.register("LightBase", LightBase, new SLightBase());
        this.register("DirectLight", DirectLight, new SDirectLight());
        this.register("SpotLight", SpotLight, new SSpotLight());
        this.register("PointLight", PointLight, new SPointLight());
        this.register("ColliderComponent", ColliderComponent, new SColliderComponent());

        //data
        this.register("Vector2D", Vector2, new SVector2D());
        this.register("Vector3D", Vector3, new SVector3D());
        this.register("Vector4D", Vector4, new SVector4D());
        this.register("Color", Color, new SColor());

        //material
        this.register("Material", MaterialBase, new SMaterial());

        //view3D
        this.register("View3D", View3D, new SView3D());

        //geometry
        this.register('GeometryBase', GeometryBase, new SGeometryBase());

        //texture
        this.register('Texture', Texture, new STexture());
        this.register('SolidColorSky', SolidColorSky, new SSolidColorSky());

        return this._nameToSerializeClass;
    }

    /**
     * Register component, it'll format
     * @param ret
     * @returns
     */
    public static registerComponent(name: string, cls: any): void {
        this.registerAll();
        this.register(name, cls, new SComponentBase());
    }

    private static register(name: string, cls: any, serialize: SerializeAble): void {
        this._nameToSerializeClass.set(name, serialize);
        this._nameToClass.set(name, cls);
        cls.prototype['__NailSerialize__'] = serialize;
        cls.prototype['__NailClassName__'] = name;
    }

    public static getClass(name: string) {
        return this._nameToClass.get(name);
    }

    public static getClassName(instance: any): string {
        return this.getConstructorName(instance.constructor);
    }

    public static getConstructorName(cls: any): string {
        return cls.prototype['__NailClassName__'];
    }

    public static getSerializeByInstance(instance: any): SerializeAble {
        return instance?.['__NailSerialize__'];
    }

    public static getSerializeByName(name: string): SerializeAble {
        return this._nameToSerializeClass.get(name);
    }
}