export let StencilSliceShader: string = /*wgsl*/ `
    #include "Common_vert"
    #include "Common_frag"
    #include "ClusterLight"
    #include "UnLit_frag"

    struct ClipToothStruct
    {
        clipEnable:f32,
        clipPosition:f32,
        slot0:f32,
        slot1:f32
    }
    struct MaterialUniform 
    {
        transformUV1:vec4<f32>,
        transformUV2:vec4<f32>,
        baseColor: vec4<f32>,
        clipData: ClipToothStruct,
    };

    @group(1) @binding(0)
    var baseMapSampler: sampler;
    @group(1) @binding(1)
    var baseMap: texture_2d<f32>;

    @group(2) @binding(0)
    var<uniform> materialUniform: MaterialUniform;

    fn vert(inputData:VertexAttributes) -> VertexOutput {
        ORI_Vert(inputData) ;
        return ORI_VertexOut ;
    }

    fn isOutOffPlanes() -> bool{
        let pos = ORI_VertexVarying.vWorldPos.xyz;
        let cutTag = materialUniform.clipData.clipEnable;
        if(cutTag > 0.5){
            if(cutTag > 1.5){
                return pos.y >= materialUniform.clipData.clipPosition;
            }else{
                return pos.y <= materialUniform.clipData.clipPosition;
            }
        }
        return false;
    }

    fn frag(){
        var transformUV1 = materialUniform.transformUV1;
        var transformUV2 = materialUniform.transformUV2;

        var uv = transformUV1.zw * ORI_VertexVarying.fragUV0 + transformUV1.xy; 
        let baseColor = textureSample(baseMap,baseMapSampler,uv) ;
        if(baseColor.w < 0.5){
            discard ;
        }

        let isOutOffPlanes = isOutOffPlanes();
        if(isOutOffPlanes){
            discard ;
        }

        var lightColor = vec4<f32>(0.0);
        let lightIndex = getCluster();
        let start = max(lightIndex.start, 0.0);
        let count = max(lightIndex.count, 0.0);
        let end = max(start + count , 0.0);
        for(var i:i32 = i32(start) ; i < i32(end); i += 1 )
        {
          let light = getLight(i32(i));
  
          switch (light.lightType) {
            case PointLightType: {
            }
            case DirectLightType: {
                var normal = ORI_VertexVarying.vWorldNormal ;
                let intensity = (light.intensity/10.0);
                let att = max(dot(normal,-light.direction),0.0) * intensity ;
                lightColor += baseColor * att * 0.5 + baseColor * 0.5 ; 
            }
            case SpotLightType: {
            }
            default: {
            }
          }
        }
        
        var useBaseColor = materialUniform.baseColor;
        if(ORI_VertexVarying.face){
            useBaseColor = vec4<f32>(0.0, 0.0, 1.0, 1.0);
        }else{
            useBaseColor = vec4<f32>(0.0, 1.0, 0.0, 1.0);
        }
        ORI_ShadingInput.BaseColor = lightColor * useBaseColor ;
        ORI_ShadingInput.BaseColor.w = 1.0 ;
       
        UnLit();
    }
`

