import { mergeGeomtries } from "..";
import { GeometryBase } from "../core/geometry/GeometryBase";
import { ToothBorderFinder } from "./ToothBorderFinder";
import { ToothExtrudeGeometry } from "./ToothExtrudeGeometry";
import { ToothSectionGeometry } from "./ToothSectionGeometry";

export class ToothMakeBorder {
    public make(srcGeometry: GeometryBase, bottom: number, merge: boolean = true): GeometryBase[] {
        let time = performance.now();

        let borderFinder = new ToothBorderFinder();
        let borders = borderFinder.find(srcGeometry);
        console.log('查找边缘时间', performance.now() - time);
        console.log('洞的数量', borders.length);
        console.log('第一个洞边的数量', borders[0].edges.valueList.length);

        // for (let border of borders) {
        //     let green = Color.randomRGB();
        //     green.r *= Math.random() > 0.5 ? 1.5 : 0.5;
        //     green.g *= Math.random() > 0.5 ? 1.5 : 0.5;
        //     green.b *= Math.random() > 0.5 ? 1.5 : 0.5;
        //     if (green.r + green.g + green.b < 1) {
        //         green.r += 1 - green.g + green.b;
        //     }
        //     for (let edge of border.edges.valueList) {
        //         scene.view.graphic3D.drawLines('mesh_' + edge.id, [edge.fPoint, edge.tPoint], green);
        //     }
        // }

        let result: GeometryBase[] = []
        let extrudeGeometry = new ToothExtrudeGeometry();
        extrudeGeometry.make(borders[0].edges.valueList, bottom);
        result.push(extrudeGeometry);

        let sectionGeometry = new ToothSectionGeometry();
        sectionGeometry.make(borders[0].edges.valueList, bottom);
        result.push(sectionGeometry);

        if (merge) {
            let result = mergeGeomtries([extrudeGeometry, sectionGeometry, srcGeometry]);
            return [result];
        } else {
            return [extrudeGeometry, sectionGeometry];
        }
    }

}