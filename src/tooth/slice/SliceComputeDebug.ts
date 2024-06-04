import {
  View3D,
  webGPUContext,
  PostBase,
  ComputeShader,
  GPUContext,
  GPUTextureFormat,
  RTDescriptor,
  RTFrame,
  RendererPassState,
  VirtualTexture,
  WebGPUDescriptorCreator,
  CollisionPassRenderer,
  StorageGPUBuffer,
  UniformGPUBuffer,
} from "@orillusion/core";

let Test_cs: string = /*wgsl*/ `

  struct SliceSetting
  {
    height:f32,
    triangleCount:f32,
    resolutionX:f32,
    resolutionY:f32,

    viewPortWidth:f32,
    viewPortHeight:f32,
    slot0:f32,
    slot1:f32,
  }

  @group(0) @binding(1) var<uniform> sliceUniform: SliceSetting;
  @group(0) @binding(2) var colorTex : texture_2d<f32>;
  @group(0) @binding(3) var<storage, read_write> sliceBuffer : array<f32>;
  @group(0) @binding(4) var outTex : texture_storage_2d<rgba16float, write>;

  var<private> texSize: vec2<u32>;
  var<private> fragCoord: vec2<i32>;
  
  @compute @workgroup_size( 8 , 8 , 1 )
  fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
  {
    fragCoord = vec2<i32>( globalInvocation_id.xy );
    texSize = textureDimensions(outTex).xy;
    let destTexSize = textureDimensions(colorTex).xy;
    if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
        return;
    }
    let uv = vec2<f32>(f32(fragCoord.x) / f32(texSize.x), f32(fragCoord.y) / f32(texSize.y));
    let srcCoord = vec2<i32>( i32(uv.x * f32(destTexSize.x)), i32(uv.y * f32(destTexSize.y)));
    let wColor = textureLoad(colorTex, srcCoord, 0);
    textureStore(outTex, fragCoord , wColor);
  }
`
export class SliceComputeDebug extends PostBase {
  private outputTexture: VirtualTexture;
  private blendCompute: ComputeShader;
  private rtFrame: RTFrame;
  private rendererPassState: RendererPassState;
  private sliceBuffer: StorageGPUBuffer;
  private sliceUniform: UniformGPUBuffer;

  private createCompute() {
    this.blendCompute = new ComputeShader(Test_cs);
    this.blendCompute.setSamplerTexture('colorTex', CollisionPassRenderer.map);
    this.blendCompute.setStorageTexture(`outTex`, this.outputTexture);
  }

  constructor(sliceBuffer: StorageGPUBuffer, sliceUniform: UniformGPUBuffer) {
    super();
    this.sliceUniform = sliceUniform;
    this.sliceBuffer = sliceBuffer;
  }

  private createResource() {
    let [w, h] = webGPUContext.presentationSize;
    this.outputTexture = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
    this.outputTexture.name = 'cTex';
    let collisionDesc = new RTDescriptor();
    collisionDesc.loadOp = `load`;
    this.rtFrame = new RTFrame([this.outputTexture], [collisionDesc]);
  }

  render(view: View3D, command: GPUCommandEncoder) {
    if (!this.blendCompute) {
      this.createResource();
      this.createCompute();
      this.onResize();

      this.rendererPassState = WebGPUDescriptorCreator.createRendererPassState(this.rtFrame, null);
      this.rendererPassState.label = "Debug";
    }

    GPUContext.computeCommand(command, [this.blendCompute]);
    GPUContext.lastRenderPassState = this.rendererPassState;
  }

  public onResize() {
    let [w, h] = webGPUContext.presentationSize;
    this.outputTexture.resize(w, h);

    let fullWorkerSizeX = Math.ceil(w / 8);
    let fullWorkerSizeY = Math.ceil(h / 8);

    this.blendCompute.workerSizeX = fullWorkerSizeX;
    this.blendCompute.workerSizeY = fullWorkerSizeY;
    this.blendCompute.workerSizeZ = 1;
  }
}