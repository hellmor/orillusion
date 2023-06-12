import { Object3D, Engine3D } from "../../src";
import { SerializationUtil } from "./SerializationUtil";
import { SerializeAssetsCollect } from "./SerializeAssetsCollect";
import { SerializeData, SerializeVersion, SerializeObject3D } from "./SerializeData";

export class SerializeTool {
    data: SerializeData;
    assets: SerializeAssetsCollect;

    public serialize(object3D: Object3D): SerializeData {
        this.data = new SerializeData();
        this.collectAssets(object3D);
        this.writeDependency();
        this.writeSerializeData(object3D);

        return this.data;
    }

    private collectAssets(scene: Object3D): void {
        this.assets = new SerializeAssetsCollect();
        this.assets.collect(scene);

        this.data.textures = this.assets.retTextures;
        this.data.materials = this.assets.retMaterials;
        this.data.geometries = this.assets.retGeometries;
    }

    private writeSerializeData(object3D: Object3D): void {
        this.writeVersion();
        this.writeObject3Ds(object3D);
        if (object3D.isScene3D) {
            this.writeRender();
        }
    }

    private writeVersion(): void {
        this.data.version = new SerializeVersion();
    }

    private writeObject3Ds(object3D: Object3D): void {
        this.data.hierarchy = [];
        this.writeObject3D(object3D);
    }

    private writeObject3D(object3D: Object3D): SerializeObject3D {
        let data: SerializeObject3D = SerializationUtil.serialization(object3D, this.assets);
        data.index = this.data.hierarchy.length;
        this.data.hierarchy.push(data);
        let children: number[];
        if (object3D.prefabRef) {
            this.appendPrefabRef(object3D.prefabRef);
        } else if (object3D.serializeTag != "only-self") {
            if (object3D.entityChildren.length > 0) {
                for (const child of object3D.entityChildren) {
                    if (child instanceof Object3D) {
                        if (child.serializeTag != 'dont-serialize') {
                            let childData: SerializeObject3D = this.writeObject3D(child);
                            children ||= [];
                            children.push(childData.index);
                        }
                    }
                }
            }
        }
        data.children = children;

        return data;
    }

    private writeRender(): void {
        let dataString = JSON.stringify(Engine3D.setting);
        let dataObj = JSON.parse(dataString);
        //丢弃一些设定数据
        delete dataObj['memorySetting'];
        delete dataObj['debug'];
        delete dataObj['performance'];
        delete dataObj['pick'];
        //存储engineSetting
        this.data.engineSetting = dataObj;
    }

    private writeDependency() {
        this.assets.retGeometries.forEach((item) => {
            if (item.asset) {
                if (item.asset.type == 'gltf') {
                    this.appendGLTF(item.asset.file);
                } else if (item.asset.type == 'glb') {
                    throw new Error('不支持：  ' + item.asset.file)
                }
            }
        });
    }

    private appendPrefabRef(prefab: string): void {
        this.data.prefabList ||= [];
        if (this.data.prefabList.indexOf(prefab) == -1) {
            this.data.prefabList.push(prefab);
        }
    }

    private appendGLTF(gltf: string): void {
        this.data.gltfList ||= [];
        if (this.data.gltfList.indexOf(gltf) == -1) {
            this.data.gltfList.push(gltf);
        }
    }
}