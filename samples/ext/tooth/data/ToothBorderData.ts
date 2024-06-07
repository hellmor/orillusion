import { OrderMap } from "../../math/OrderMap";
import { ToothEdgeData } from "./ToothEdgeData";

export class ToothBorderData {
    readonly fStart: number;
    constructor(fStart: number) {
        this.fStart = fStart;
    }
    vIndexSet: Set<number> = new Set<number>();
    edges: OrderMap<String, ToothEdgeData> = new OrderMap<String, ToothEdgeData>(null, false, true);
    nextVertex: number = -1;
}