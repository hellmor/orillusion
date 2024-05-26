import { ComputeShader, ComputeGPUBuffer, View3D, Camera3D, GeometryBase, GlobalBindGroup, GPUContext, Vector3, UniformGPUBuffer, Slice_compute_cs, Vector2, Scene3D, Object3D, Matrix4, append } from "../..";


/**
 * @internal
 * @group IO
 */
export class SliceCompute {
  private _computeShader: ComputeShader;
  private _outBuffer: ComputeGPUBuffer;
  private _mvMatrixUniform: UniformGPUBuffer;
  private _sliceUniform: UniformGPUBuffer;
  private _sliceUniformArray: Float32Array;

  private _mvMatrix: Matrix4;
  private _orthCamera: Camera3D;
  constructor() { }

  public init() {
    this._computeShader = new ComputeShader(Slice_compute_cs);

    let maxCount = 4096 * 4096 * 4;
    let size = Math.ceil(maxCount / 64);
    let x = 1024;
    let y = Math.ceil(size / x);

    console.log('行列', x, y);

    this._outBuffer = new ComputeGPUBuffer(32);
    this._computeShader.setStorageBuffer('outBuffer', this._outBuffer);
    this._computeShader.workerSizeX = x;
    this._computeShader.workerSizeY = y;

    this._mvMatrixUniform = new UniformGPUBuffer(16);

    this._sliceUniform = new UniformGPUBuffer(16);
    this._sliceUniformArray = new Float32Array(16);
    this._sliceUniform.setFloat32Array('data', this._sliceUniformArray);

    this._mvMatrix = new Matrix4().identity();
    return this;
  }



  compute(view: View3D, modelMatrix: Matrix4, geometry: GeometryBase, worldHeight: number,) {

    let viewMatrix = this.getOrthCamera(view.scene).viewMatrix;
    append(modelMatrix, viewMatrix, this._mvMatrix);

    this._computeShader.setStorageBuffer('indexBuffer', geometry.indicesBuffer.indicesGPUBuffer);
    this._computeShader.setStorageBuffer('vertexBuffer', geometry.vertexBuffer.vertexGPUBuffer);

    this._mvMatrixUniform.setFloat32Array('data', this._mvMatrix.rawData);
    this._mvMatrixUniform.apply();
    this._computeShader.setUniformBuffer('worldMatrix', this._mvMatrixUniform);

    this.updateSliceUniform(geometry, worldHeight, new Vector2(4096, 4096));

    this._sliceUniform.apply();
    this._computeShader.setUniformBuffer('sliceUniform', this._sliceUniform);

    let command = GPUContext.beginCommandEncoder();
    GPUContext.computeCommand(command, [this._computeShader]);
    GPUContext.endCommandEncoder(command);


    // this._outBuffer.readBuffer();
  }

  private getOrthCamera(scene: Scene3D): Camera3D {
    if (!this._orthCamera) {
      this._orthCamera = new Object3D().addComponent(Camera3D);
      scene.addChild(this._orthCamera.object3D);
    }
    return this._orthCamera;
  }

  private updateSliceUniform(geometry: GeometryBase, worldHeight: number, resolution: Vector2) {
    let array = this._sliceUniformArray;
    array[0] = worldHeight;
    array[1] = geometry.indicesBuffer.indicesCount / 3;
    array[2] = resolution.x;
    array[3] = resolution.y;

    array[4] = this._orthCamera.viewPort.width;
    array[5] = this._orthCamera.viewPort.height;
    array[6] = 0;
    array[7] = 0;

    this._sliceUniform.setFloat32Array('data', array);

  }

  /**
   * Returns world position of pick result
   * @returns
   */
  public getPickWorldNormal(target?: Vector3): Float32Array {
    return this._outBuffer.outFloat32Array;
  }

}
