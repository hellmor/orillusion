import { ArrayBufferData, GeometryBase, Matrix4, Vector3, VertexAttributeName, cloneGeometry } from "..";

export class ToothModelTransformer {
    private _input: GeometryBase;
    private _outputGeometry: GeometryBase;
    //用于返回的geometry
    public get outputGeometry(): GeometryBase {
        return this._outputGeometry;
    }

    constructor(geometry: GeometryBase) {
        this._input = geometry;
        this._outputGeometry = cloneGeometry(this._input);
    }

    //使用matrix进行transform控制
    public transform(matrix: Matrix4): GeometryBase {
        let srcPosition = this._input.vertexAttributeMap.get(VertexAttributeName.position);
        let destPosition = this._outputGeometry.vertexAttributeMap.get(VertexAttributeName.position);

        this.multiplyArray(srcPosition.data, destPosition.data, matrix);
        this._outputGeometry.computeNormals();

        this._outputGeometry.vertexBuffer.updateAttributes(this._outputGeometry.vertexAttributeMap)
        return this._outputGeometry;
    }

    private multiplyArray(srcArray: ArrayBufferData, destArray: ArrayBufferData, matrix: Matrix4) {
        let srcVec3: Vector3 = new Vector3();
        let destVec3: Vector3 = new Vector3();
        let vertexCount = srcArray.length / 3;
        let offset: number = 0;
        for (let i = 0; i < vertexCount; i++) {
            offset = i * 3;
            srcVec3.set(srcArray[offset], srcArray[offset + 1], srcArray[offset + 2]);
            matrix.transformPoint(srcVec3, destVec3);
            destArray[offset] = destVec3.x;
            destArray[offset + 1] = destVec3.y;
            destArray[offset + 2] = destVec3.z;
        }
    }

}