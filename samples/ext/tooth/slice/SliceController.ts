import { Color, ComponentBase, ComputeGPUBuffer, Engine3D, MeshRenderer, Object3D, PlaneGeometry, UnLitMaterial, Vector3, clamp } from "@orillusion/core";
import { StencilSliceMaterial } from "../material/StencilSliceMaterial";
import { ToothClipTag } from "../material/ToothClipTag";

export class SliceController extends ComponentBase {
    sliceBuffer: ComputeGPUBuffer;
    up: Vector3 = Vector3.UP;
    position: Vector3 = new Vector3();
    material: StencilSliceMaterial;
    planeObj: Object3D;

    private _sliceIndex: number = 0;
    public get sliceIndex(): number {
        return this._sliceIndex;
    }

    public set sliceIndex(value: number) {
        if (this._sliceIndex != value) {
            this._sliceIndex = value;
            this.planeObj.localPosition = new Vector3(0, value, 0);
            this.material.setClipPosition(value);
        }
    }

    /**
     * @param {ComputeGPUBuffer} sliceBuffer 读取buffer的数据源
     * @param {StencilSliceMaterial} material clip牙齿的材质球
     * @param {number} maxIndex 切片最大层数，将从0~maxIndex逐层处理。一共切100次。
     * @param {number} [indexOffset=0.5] 放置plane的时候，给到半个精度偏移量。放置的模型，在切片层数为0位置由于顶点数据的y都是0，可能会导致没有实心像素点生成。
     * @memberof SliceController
     */
    public initController(sliceBuffer: ComputeGPUBuffer, material: StencilSliceMaterial) {
        this.sliceBuffer = sliceBuffer;
        this.material = material;

        this.material.setClipEnable(ToothClipTag.Negative);
        this.planeObj = this.initPlane();
    }

    initPlane() {
        let plane = new Object3D();
        let renderer = plane.addComponent(MeshRenderer);
        let geometry = new PlaneGeometry(4096, 4096);
        let material = new UnLitMaterial();
        material.baseColor = new Color(1, 0, 0, 1);
        material.castShadow = false;
        material.acceptShadow = false;
        material.doubleSide = true;

        let depthStencil: GPUDepthStencilState = {
            depthWriteEnabled: false,
            depthCompare: 'always',
            stencilWriteMask: 0xFFFFFFFF,
            stencilReadMask: 0xFFFFFFFF,
            stencilBack: { compare: "not-equal", failOp: 'replace', passOp: 'replace', depthFailOp: 'replace' },
            stencilFront: { compare: "not-equal", failOp: 'replace', passOp: 'replace', depthFailOp: 'replace' }
        } as any;
        material.shader.getDefaultColorShader().depthStencil = depthStencil;
        renderer.geometry = geometry;
        renderer.material = material;
        Engine3D.views[0].scene.addChild(plane);
        return plane;
    }

    public async read(){
        let srcArray = await this.sliceBuffer.readBuffer(true)
        let totalCount = srcArray.length;
        let array = new Uint8Array(totalCount);
        array.set(srcArray)
        return array
    }
}