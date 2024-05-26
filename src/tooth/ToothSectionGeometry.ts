import { BoundingBox, GeometryBase, ToothEdgeData, Vector3, VertexAttributeName } from "..";
import { triangulate } from "./triangulate";

export class ToothSectionGeometry extends GeometryBase {
    public make(edges: ToothEdgeData[], bottom: number): this {

        this.bounds = new BoundingBox(new Vector3(-100, -100, -100), new Vector3(100, 100, 100));

        let vertexList = this.genTriangle(edges);
        let vertexCount = vertexList.length / 2;

        let position_arr = new Float32Array(vertexCount * 3);
        let normal_arr = new Float32Array(vertexCount * 3);
        let uv_arr = new Float32Array(vertexCount * 2);

        for (let i = 0, c = vertexCount; i < c; i++) {
            //position
            let pos_offset = i * 3;//4个顶点XYZ
            let uv_offset = i * 2;//4个顶点UV

            position_arr[pos_offset] = vertexList[i * 2];
            position_arr[pos_offset + 1] = bottom;
            position_arr[pos_offset + 2] = vertexList[i * 2 + 1];

            normal_arr[pos_offset] = 1;
            normal_arr[pos_offset + 1] = 1;
            normal_arr[pos_offset + 2] = 1;

            pos_offset += 3;

            uv_arr[uv_offset] = 0;
            uv_arr[uv_offset + 1] = 0;
        }

        //indecies
        let indices_arr = new Uint32Array(vertexCount);
        for (let i = 0; i < vertexCount; i++) {
            indices_arr[i] = i;
        }

        //
        this.setIndices(indices_arr);
        this.setAttribute(VertexAttributeName.position, position_arr);
        this.setAttribute(VertexAttributeName.normal, normal_arr);
        this.setAttribute(VertexAttributeName.uv, uv_arr);
        this.setAttribute(VertexAttributeName.TEXCOORD_1, uv_arr);
        //
        this.addSubGeometry({
            indexStart: 0,
            indexCount: indices_arr.length,
            vertexStart: 0,
            vertexCount: 0,
            firstStart: 0,
            index: 0,
            topology: 0,
        });

        this.computeNormals();
        return this;
    }

    private genTriangle(edges: ToothEdgeData[]) {
        let coords: number[] = [];
        for (let edge of edges) {
            let point = edge.fPoint;
            coords.push(point.x, point.z);
        }
        let polyTriangles = triangulate([coords]);
        return polyTriangles;
    }
}