import { Vector3 } from "../../math/Vector3";

export class ToothEdgeData {

    static EdgeID: number = 0;

    fPoint: Vector3;
    tPoint: Vector3;
    ownerCount: number = 0;

    readonly id: number = 0;
    readonly key: string;
    readonly fIndex: number;
    readonly tIndex: number;

    constructor(key: string, fIndex: number, tIndex: number) {
        this.key = key;
        this.fIndex = fIndex;
        this.tIndex = tIndex;
        this.id = ToothEdgeData.EdgeID++;
    }
}