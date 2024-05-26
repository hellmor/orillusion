import { BoundingBox, Vector3 } from "..";
import { GeometryBase } from "../core/geometry/GeometryBase";
import { VertexAttributeName } from "../core/geometry/VertexAttributeName";

export function cloneGeometry(input: GeometryBase): GeometryBase {
    let output = new GeometryBase();
    for (let key of input.vertexAttributeMap.keys()) {
        let value = input.vertexAttributeMap.get(key);
        output.setAttribute(key, value.data.slice());
    }

    let indecies = input.getAttribute(VertexAttributeName.indices).data;

    output.addSubGeometry({
        indexStart: 0,
        indexCount: indecies.length,
        vertexStart: 0,
        vertexCount: 0,
        firstStart: 0,
        index: 0,
        topology: 0
    });

    return output;
}

export function mergeGeomtries(list: GeometryBase[]): GeometryBase {
    let first = list[0];
    let keys = first.vertexAttributeMap.keys();

    let retIndeciesCount = 0;
    let retPositionCount = 0;

    for (let key of keys) {
        for (let geometry of list) {
            let attribute = geometry.getAttribute(key);
            if (key == VertexAttributeName.indices) {
                retIndeciesCount += attribute.data.length;
            } else if (key == VertexAttributeName.position) {
                retPositionCount += attribute.data.length;
            }
        }
    }

    let position_arr = new Float32Array(retPositionCount);
    let normal_arr = new Float32Array(retPositionCount);
    let uv_arr = new Float32Array(retPositionCount / 3 * 2);
    let indices_arr = new Uint32Array(retIndeciesCount);

    //合并
    let indeciesOffset = 0;
    let positionOffset = 0;
    let normalOffset = 0;
    let uvOffset = 0;

    for (let geometry of list) {
        //合并indecies
        let key = VertexAttributeName.indices;
        let nextArray = geometry.getAttribute(key).data;
        let vertexOffset = positionOffset / 3;
        for (let i = 0, c = nextArray.length; i < c; i++) {
            indices_arr[indeciesOffset + i] = nextArray[i] + vertexOffset;
        }
        indeciesOffset += nextArray.length;
        //合并position
        key = VertexAttributeName.position;
        nextArray = geometry.getAttribute(key).data;
        for (let i = 0, c = nextArray.length; i < c; i++) {
            position_arr[positionOffset + i] = nextArray[i];
        }
        positionOffset += nextArray.length;
        //合并uv
        key = VertexAttributeName.uv;
        nextArray = geometry.getAttribute(key).data;
        for (let i = 0, c = nextArray.length; i < c; i++) {
            uv_arr[uvOffset + i] = nextArray[i];
        }
        uvOffset += nextArray.length;
        //合并normal
        key = VertexAttributeName.normal;
        nextArray = geometry.getAttribute(key).data;
        for (let i = 0, c = nextArray.length; i < c; i++) {
            normal_arr[normalOffset + i] = nextArray[i];
        }
        normalOffset += nextArray.length;
    }

    let result = new GeometryBase();
    result.setIndices(indices_arr);
    result.setAttribute(VertexAttributeName.position, position_arr);
    result.setAttribute(VertexAttributeName.normal, normal_arr);
    result.setAttribute(VertexAttributeName.uv, uv_arr);
    result.setAttribute(VertexAttributeName.TEXCOORD_1, uv_arr);

    result.addSubGeometry({
        indexStart: 0,
        indexCount: indices_arr.length,
        vertexStart: 0,
        vertexCount: 0,
        firstStart: 0,
        index: 0,
        topology: 0
    });
    let max = 999999;
    result.bounds = new BoundingBox(new Vector3(-max, -max, -max), new Vector3(max, max, max));

    return result;
}