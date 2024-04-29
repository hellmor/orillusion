export let ToothMaterialUniform_frag = /* wgsl */`


#if CLIP_MODEL_PLANE
  struct MaterialUniform {
    transformUV1:vec4<f32>,
    transformUV2:vec4<f32>,
    selectPlane: vec4<f32>,
    selectPlaneColor: vec4<f32>,
    baseColor: vec4<f32>,
    backFaceColor: vec4<f32>,
    enableClipTags: vec4<f32>,
    clipPlanesData: array<vec4<f32>, 4u>
  };
#else
    struct MaterialUniform {
      transformUV1:vec4<f32>,
      transformUV2:vec4<f32>,
      baseColor: vec4<f32>,
      alphaCutoff: f32,
    };
#endif


@group(2) @binding(0)
var<uniform> materialUniform: MaterialUniform;
`