import { clamp } from "..";
import { GeometryBase } from "../core/geometry/GeometryBase";
import { VertexAttributeName } from "../core/geometry/VertexAttributeName";

export class ToothClipModel {
    readonly _min: number = -40;
    readonly _max: number = 40;

    private _top: number = 0;
    public get top(): number {
        return this._top;
    }
    public set top(value: number) {
        this._top = value;
        this._top = clamp(this._top, this._min, this._max);
    }
    private _bottom: number = 10;
    public get height(): number {
        return this._bottom;
    }

    public set height(value: number) {
        this._bottom = value;
        this._bottom = clamp(this._bottom, 0.001, 100);
    }

    constructor(min: number, max: number) {
        this._min = min;
        this._max = max;
    }

    clip(srcGeometry: GeometryBase): GeometryBase {
        let time = performance.now();
        let indecies = srcGeometry.getAttribute(VertexAttributeName.indices).data;
        let triangleCount = indecies.length / 3;
        let position = srcGeometry.getAttribute(VertexAttributeName.position).data;
        let enableList: boolean[] = [];
        for (let i = 0, c = position.length / 3; i < c; i++) {
            let offset = i * 3;
            enableList[i] = position[offset + 1] > this.top;//y
        }

        let newIndecies: number[] = [];
        let indexOffset = 0;

        for (let i = 0; i < triangleCount; i++) {
            indexOffset = i * 3;
            let a = indecies[indexOffset];
            let b = indecies[indexOffset + 1];
            let c = indecies[indexOffset + 2];

            let triangleEnable = enableList[a] && enableList[b] && enableList[c];

            if (triangleEnable) {
                newIndecies.push(a, b, c);
            }
        }

        let buffer = srcGeometry.getAttribute(VertexAttributeName.indices);
        buffer.data = new Uint32Array(newIndecies);
        console.log('Clip Time', performance.now() - time);
        console.log('Clip Ret', indecies.length / 3, newIndecies.length / 3);

        let ret = new GeometryBase();
        ret.setIndices(new Uint32Array(newIndecies));
        for (let key of srcGeometry.vertexAttributes) {
            if (key != VertexAttributeName.indices) {
                ret.setAttribute(key, srcGeometry.getAttribute(key).data);
            }
        }
        ret.addSubGeometry({
            indexStart: 0,
            indexCount: newIndecies.length,
            vertexStart: 0,
            vertexCount: 0,
            firstStart: 0,
            index: 0,
            topology: 0
        });
        return ret;
    }

}