import { ComputeGPUBuffer } from "../..";
import { CDelegate } from "../CDelegate";

export class SliceImageData {
    array: Uint8Array;
    index: number;
    count: number;
}

export class SliceDataReader {
    private _interval: number = 0;
    private _buffer: ComputeGPUBuffer;
    private _index: number;
    private _isReading: boolean;
    public readonly callback: CDelegate = new CDelegate();
    public get isReading(): boolean {
        return this._isReading;
    }

    public readBuffer(buffer: ComputeGPUBuffer, index: number) {
        if (this._isReading) {
            throw new Error('只能同时读取一次数据！');
        }
        this._isReading = true;
        this._buffer = buffer;
        this._index = index;
        this._interval = setInterval(() => { this.checkReadingComplete() }, 1);
        buffer.readBuffer();
    }

    private checkReadingComplete() {
        if (!this._buffer['_readFlag']) {
            clearInterval(this._interval);

            let srcArray = this._buffer.outFloat32Array;
            let totalCount = srcArray.length;
            let count = 0;
            let array = new Uint8Array(totalCount);
            for (let i = 0; i < totalCount; i++) {
                let value = srcArray[i];
                if (value > 0.5) {
                    srcArray[i] = 1;
                    count++;
                }
            }
            let data = new SliceImageData();
            data.array = array;
            data.count = count;
            data.index = this._index;

            this._isReading = false;
            this.callback.execute(data);
        }
    }
}
