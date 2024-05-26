export let Collision_shader: string = /*wgsl*/ `
#include "Common_vert"
#include "FragmentVarying"
#include "GlobalUniform"

struct FragmentOutput {
    @location(auto) o_Color: vec4<f32>
};

struct MaterialUniform {
    baseColor: vec4<f32>,
};

@group(2) @binding(0)
var<uniform> materialUniform: MaterialUniform;

@group(1) @binding(auto)
var baseMapSampler: sampler;
@group(1) @binding(auto)
var baseMap: texture_2d<f32>;


fn vert(inputData:VertexAttributes) -> VertexOutput {
    ORI_Vert(inputData) ;
    return ORI_VertexOut ;
}

var<private> ORI_FragmentOutput: FragmentOutput;
var<private> ORI_VertexVarying: FragmentVarying;

@fragment
fn FragMain(vertex_varying:FragmentVarying) -> FragmentOutput {
    ORI_VertexVarying = vertex_varying;

    var texColor = textureSample(baseMap, baseMapSampler, ORI_VertexVarying.fragUV0.xy );

    var o_Color = vec4<f32>((texColor * materialUniform.baseColor).rgb , 1.0)  ;
    o_Color.w = ORI_VertexVarying.vWorldPos.w;//meshID
    return FragmentOutput(o_Color);
}

`

