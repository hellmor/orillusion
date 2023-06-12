import { ISerializeAssetsCollect } from "@orillusion/serialization/ISerializeAssetsCollect";
import { SerializeComponentBase, SerializeCamera3D } from "@orillusion/serialization/SerializeData";
import { UnSerializeData } from "@orillusion/serialization/unSerialize/UnSerializeData";
import { Camera3D, CameraType } from "@orillusion/core";
import { SComponentBase } from "./SComponentBase";

export class SCamera3D extends SComponentBase {
    public serialize(camera3D: Camera3D, assets: ISerializeAssetsCollect): SerializeComponentBase {
        let data: SerializeCamera3D = new SerializeCamera3D();

        this.serializeBase(camera3D, data);

        data.fov = camera3D.fov;
        data.near = camera3D.near;
        data.far = camera3D.far;

        data.cameraType = camera3D.type;
        data.isShadowCamera = camera3D.isShadowCamera;
        return data;
    }

    unSerialize(camera3D: Camera3D, componentData: SerializeComponentBase, data: UnSerializeData) {
        camera3D.enable = componentData.enable;

        let cData = componentData as SerializeCamera3D;
        camera3D.type = cData.cameraType;
        camera3D.fov = cData.fov;
        camera3D.far = cData.far;
        camera3D.near = cData.near;
        camera3D.isShadowCamera = cData.isShadowCamera;
        if (camera3D.type == CameraType.perspective) {
            camera3D.perspective(camera3D.fov, camera3D.aspect, camera3D.near, camera3D.far);
        }
        data.cameras.push(camera3D);
        return camera3D;
    }
}
