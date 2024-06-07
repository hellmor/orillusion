import { BoundingBox, GeometryBase, ToothEdgeData, Vector3, VertexAttributeName } from "..";

export class ToothExtrudeGeometry extends GeometryBase {
    public make(edges: ToothEdgeData[], bottom: number): this {

        this.bounds = new BoundingBox(new Vector3(-100, -100, -100), new Vector3(100, 100, 100));

        let vertexCount = edges.length * 4;

        let position_arr = new Float32Array(vertexCount * 3);
        let normal_arr = new Float32Array(vertexCount * 3);
        let uv_arr = new Float32Array(vertexCount * 2);
        let indices_arr = new Uint32Array(edges.length * 2 * 3);

        let p2 = new Vector3();
        let p3 = new Vector3();

        //0 1
        //2 3
        for (let i = 0; i < edges.length; i++) {
            let p0 = edges[i].fPoint;
            let p1 = edges[i].tPoint;

            p2.copyFrom(p0);
            p2.y = bottom;

            p3.copy(p1);
            p3.y = bottom;

            //position
            let vertex: Vector3;
            let pos_offset = i * 12;//4个顶点XYZ
            let uv_offset = i * 8;//4个顶点UV

            let vertex_4 = [p0, p1, p2, p3];
            for (let j = 0; j < 4; j++) {
                vertex = vertex_4[j];
                position_arr[pos_offset] = vertex.x;
                position_arr[pos_offset + 1] = vertex.y;
                position_arr[pos_offset + 2] = vertex.z;

                normal_arr[pos_offset] = 1;
                normal_arr[pos_offset + 1] = 1;
                normal_arr[pos_offset + 2] = 1;

                pos_offset += 3;

                uv_arr[uv_offset] = 0;
                uv_arr[uv_offset + 1] = 0;
            }

            //indecies
            let indecies_offset = i * 6;//2个三角形
            pos_offset = i * 4;

            indices_arr[indecies_offset + 0] = 0 + pos_offset;
            indices_arr[indecies_offset + 1] = 2 + pos_offset;
            indices_arr[indecies_offset + 2] = 1 + pos_offset;

            indices_arr[indecies_offset + 3] = 1 + pos_offset;
            indices_arr[indecies_offset + 4] = 2 + pos_offset;
            indices_arr[indecies_offset + 5] = 3 + pos_offset;
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
}