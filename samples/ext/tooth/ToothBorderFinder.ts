import { GeometryBase, OrderMap, ToothEdgeData, Vector3, VertexAttributeName } from "..";
import { ToothBorderData } from "./data/ToothBorderData";

export class ToothBorderFinder {

    private _edgeMapAB: { [key: string]: ToothEdgeData } = {};
    private _edgeMapID: { [id: string]: ToothEdgeData } = {};
    private _vertexList: Vector3[] = [];

    public find(geometry: GeometryBase) {
        let mainEdgeList = this.findEdge(geometry);
        let mainEdgeMap = new OrderMap<string, ToothEdgeData>(null, true, true);
        //根据顶点index，构造map，将每个顶点相关的edge放入map，方便后续查找
        let edgeMapFromIndex = new Map<number, ToothEdgeData>();
        for (let item of mainEdgeList) {
            edgeMapFromIndex.set(item.fIndex, item);
            mainEdgeMap.set(item.key, item);
        }

        //取出所有的edge，归入border
        let borders: ToothBorderData[] = [];
        while (mainEdgeMap.size > 0) {
            //从主队列中取出一个edge，创建border
            let popEdge = mainEdgeMap.valueList[0];
            let border = new ToothBorderData(popEdge.fIndex);
            borders.push(border);
            this.appendEdgeToBorder(border, popEdge);
            mainEdgeMap.delete(popEdge.key);

            do {
                let nextEdge: ToothEdgeData = edgeMapFromIndex.get(border.nextVertex);
                if (nextEdge) {
                    let isCycle = border.vIndexSet.has(nextEdge.tIndex);
                    this.appendEdgeToBorder(border, nextEdge);
                    mainEdgeMap.delete(nextEdge.key);
                    if (isCycle) {
                        break;
                    }
                } else {
                    break;
                }
            } while (true);
        }

        return borders;
    }

    private appendEdgeToBorder(border: ToothBorderData, edge: ToothEdgeData) {
        border.nextVertex = edge.tIndex;
        border.vIndexSet.add(edge.fIndex);
        border.vIndexSet.add(edge.tIndex);
        border.edges.set(edge.key, edge);
    }

    private findEdge(geometry: GeometryBase): ToothEdgeData[] {
        let ret = [];

        let indecies = geometry.getAttribute(VertexAttributeName.indices).data;
        let triangleCount = indecies.length / 3;
        console.log('三角形数量：', triangleCount);

        let position = geometry.getAttribute(VertexAttributeName.position).data;

        let vertexCount = position.length / 3;
        console.log('顶点数量：', vertexCount);
        for (let vi = 0; vi < vertexCount; vi++) {
            let offset = vi * 3;
            let vertex = new Vector3(position[offset], position[offset + 1], position[offset + 2]);
            this._vertexList.push(vertex);
        }

        for (let ti = 0; ti < triangleCount; ti++) {
            let offset = ti * 3;
            let ia = indecies[offset];
            let ib = indecies[offset + 1];
            let ic = indecies[offset + 2];

            this.getOrCreateEdge(ia, ib);
            this.getOrCreateEdge(ib, ic);
            this.getOrCreateEdge(ic, ia);
        }

        //获取只属于一个三角形的边
        for (let edgeID in this._edgeMapID) {
            let edge = this._edgeMapID[edgeID];
            if (edge.ownerCount == 1) {
                ret.push(edge);
            }
        }
        return ret;
    }

    private getOrCreateEdge(f: number, t: number): ToothEdgeData {
        let min = f < t ? f : t;
        let max = f > t ? f : t;
        let key = `${min}_${max}`;
        let edge = this._edgeMapAB[key];
        if (!edge) {
            edge = new ToothEdgeData(key, f, t);
            edge.fPoint = this._vertexList[f];
            edge.tPoint = this._vertexList[t];
            this._edgeMapAB[key] = edge;
            this._edgeMapID[edge.id] = edge;
        }
        edge.ownerCount++;
        return edge;
    }

}