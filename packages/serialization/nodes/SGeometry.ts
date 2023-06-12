import { BoxGeometry, CylinderGeometry, Engine3D, GeometryBase, PlaneGeometry, SphereGeometry, TorusGeometry, Vector3 } from "@orillusion/core";
import { SerializeGeometryInstance } from "../SerializeAssetInstance";
import { SerializeAble } from "../SerializeData";
import { ISerializeAssetsCollect } from "../ISerializeAssetsCollect";
import { SerializationUtil } from "../SerializationUtil";
import { SerializationTypes } from "../SerializationTypes";
import { UnSerializeData } from "../unSerialize/UnSerializeData";
import { SerializeProtoData } from "../SerializeProtoData";

export class SGeometryBase extends SerializeAble {
    serialize(source: GeometryBase, assets: ISerializeAssetsCollect): SerializeGeometryInstance {
        let data = new SerializeGeometryInstance();
        SerializationUtil.serialization2(source, assets, data);
        let className = source.constructor.name;
        if (className.indexOf("_") >= 0) {
            className = SerializationTypes.getClassName(source);
        }
        data.className = className;
        data.asset = source.asset;
        data.name = source.name;
        return data;
    }

    unSerialize(geometry: GeometryBase, item: SerializeGeometryInstance, asset: UnSerializeData) {
        switch (item.className) {
            case 'PlaneGeometry': {
                let width: number,
                    height: number,
                    segmentW: number = 1,
                    segmentH: number = 1,
                    up: Vector3 = Vector3.Y_AXIS;
                width = item['width'];
                height = item['height'];
                segmentW = item['segmentW'];
                segmentH = item['segmentW'];
                SerializeProtoData.readVector3(item['up'], up);
                geometry = new PlaneGeometry(width, height, segmentW, segmentH, up);
                break;
            }
            case 'BoxGeometry': {
                let width: number = 1,
                    height: number = 1,
                    depth: number = 1;
                width = item['width'];
                height = item['height'];
                depth = item['depth'];
                geometry = new BoxGeometry(width, height, depth);
                break;
            }
            case 'SphereGeometry':
                {
                    let radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength;
                    radius = item['radius'];
                    widthSegments = item['widthSegments'];
                    heightSegments = item['heightSegments'];
                    phiStart = item['phiStart'];
                    phiLength = item['phiLength'];
                    thetaStart = item['thetaStart'];
                    thetaLength = item['thetaLength'];
                    geometry = new SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength);
                }
                break;
            case 'CylinderGeometry':
                let radiusTop = 1,
                    radiusBottom = 1,
                    height = 1,
                    radialSegments = 8,
                    heightSegments = 8,
                    openEnded = false,
                    thetaStart = 0,
                    thetaLength = Math.PI * 2;
                radiusTop = item['radiusTop'];
                radiusBottom = item['radiusBottom'];
                height = item['height'];
                radialSegments = item['radialSegments'];
                heightSegments = item['heightSegments'];
                openEnded = item['openEnded'];
                thetaStart = item['thetaStart'];
                thetaLength = item['thetaLength'];
                geometry = new CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength);

                break;
            case 'TorusGeometry': {
                let radius: number = 0.4,
                    tube: number = 0.1,
                    radialSegments: number = 32,
                    tubularSegments: number = 32;

                radius = item['radius'];
                tube = item['tube'];
                radialSegments = item['radialSegments'];
                tubularSegments = item['tubularSegments'];
                geometry = new TorusGeometry(radius, tube, radialSegments, tubularSegments);
                break;
            }

            case 'GeometryBase':
                switch (item.asset.type) {
                    case "gltf":
                        let gltf = Engine3D.res.getGltf(item.asset.file);
                        geometry = gltf.resources[item.asset.data];
                        break;
                    case "glb":
                        console.warn('geometry from glb cannot be supported!');
                        break;
                    case 'obj':
                        console.warn('geometry from obj cannot be supported!');
                        break;
                }
                break;
        }

        if (geometry) {
            geometry.name = item.name;
        }
        return geometry;
    }
}