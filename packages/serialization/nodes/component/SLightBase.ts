import { ISerializeAssetsCollect } from "@orillusion/serialization/ISerializeAssetsCollect";
import { SerializeLightData, SerializeComponentBase, SerializeLightComponent } from "@orillusion/serialization/SerializeData";
import { SerializeProtoData } from "@orillusion/serialization/SerializeProtoData";
import { UnSerializeData } from "@orillusion/serialization/unSerialize/UnSerializeData";
import { LightData, LightBase, Color, PointLight, DirectLight, SpotLight, RADIANS_TO_DEGREES } from "@orillusion/core";
import { SComponentBase } from "./SComponentBase";

export class SLightBase extends SComponentBase {
    public serializationLightData(lightData: LightData): SerializeLightData {
        let sData = new SerializeLightData();
        sData.lightType = lightData.lightType as number;
        sData.radius = lightData.radius;
        sData.intensity = lightData.intensity;
        sData.linear = lightData.linear;
        sData.quadratic = lightData.quadratic;
        sData.lightColor = SerializeProtoData.writeRGBA(lightData.lightColor);
        sData.innerAngle = lightData.innerAngle;
        sData.outerAngle = lightData.outerAngle;
        sData.range = lightData.range;
        sData.lightTangent = lightData.lightTangent;
        // sData.iesPofiles = lightData.iesPofiles;
        return sData;
    }

    public serialize(lightBase: LightBase, assets: ISerializeAssetsCollect): SerializeComponentBase {
        let data: SerializeLightComponent = new SerializeLightComponent();
        this.serializeBase(lightBase, data);
        data.size = lightBase.size;
        data.dirFix = lightBase.dirFix;
        data.castGI = lightBase.castGI;
        data.castShadow = lightBase.castShadow;
        data.lightData = this.serializationLightData(lightBase.lightData);
        return data;
    }

    unSerialize(light: LightBase, cData: SerializeLightComponent, data: UnSerializeData): LightBase {
        light.enable = cData.enable;

        let lightData: SerializeLightData = cData.lightData;
        light.size = cData.size;
        light.dirFix = cData.dirFix;
        let color = light.lightColor || new Color();
        SerializeProtoData.readRGBA(lightData.lightColor, color);
        light.lightColor = color;
        light.intensity = lightData.intensity;
        light.castGI = cData.castGI;
        light.castShadow = cData.castShadow;
        return light;
    }
}

export class SPointLight extends SLightBase {
    unSerialize(light: PointLight, componentData: SerializeLightComponent, data: UnSerializeData): PointLight {
        super.unSerialize(light, componentData, data);
        let lightData = (componentData as SerializeLightComponent).lightData;
        light.range = lightData.range;
        light.at = lightData.linear;
        light.radius = lightData.radius;
        light.quadratic = lightData.quadratic;
        return light;
    }
}

export class SDirectLight extends SLightBase {
    unSerialize(light: DirectLight, componentData: SerializeLightComponent, data: UnSerializeData): DirectLight {
        super.unSerialize(light, componentData, data);
        let lightData = (componentData as SerializeLightComponent).lightData;
        light.radius = lightData.range;
        light.indirect = lightData.quadratic;
        return light;
    }
}

export class SSpotLight extends SLightBase {

    unSerialize(light: SpotLight, componentData: SerializeLightComponent, data: UnSerializeData): SpotLight {
        super.unSerialize(light, componentData, data);
        let lightData = (componentData as SerializeLightComponent).lightData;
        light.innerAngle = lightData.innerAngle / lightData.outerAngle * 100.0;
        light.outerAngle = lightData.outerAngle * RADIANS_TO_DEGREES * 2;
        light.radius = lightData.radius;
        light.range = lightData.radius;
        light.at = lightData.linear;
        return light;
    }
}
