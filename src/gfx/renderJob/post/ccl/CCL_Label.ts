export let CCL_Label: string = /*wgsl*/ `

    struct PickData{
      plane:vec4<f32>,
      meshID:f32,
      slot0:f32,
      slot1:f32,
      slot2:f32,
    }

    @group(0) @binding(0) var<uniform> pickData: PickData;
    @group(0) @binding(1) var<storage, read_write> cclBuffer : array<f32>;
    @group(0) @binding(2) var posTex : texture_2d<f32>;
    @group(0) @binding(3) var normalTex : texture_2d<f32>;
    @group(0) @binding(4) var colorTex : texture_2d<f32>;
    @group(0) @binding(5) var outTex : texture_storage_2d<rgba16float, write>;
    
    var<private> texSize: vec2<u32>;
    var<private> fragCoord: vec2<i32>;
    var<private> wPosition: vec3<f32>;
    var<private> wNormal: vec3<f32>;
    var<private> wColor: vec4<f32>;
    
    @compute @workgroup_size( 8 , 8 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
      fragCoord = vec2<i32>( globalInvocation_id.xy );
      texSize = textureDimensions(posTex).xy;
      if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
          return;
      }
      let wn = textureLoad(normalTex, fragCoord, 0);
      wColor = textureLoad(colorTex, fragCoord, 0);
      var label:f32 = -1.0;
      let index = fragCoord.x + fragCoord.y * i32(texSize.x);
      if(wn.w < 0.5){//sky
          
      }else{
        let wp = textureLoad(posTex, fragCoord, 0);
        if(round(wp.w) == round(pickData.meshID)){
          wPosition = wp.xyz;
          wNormal = normalize(vec3<f32>(wn.xyz) * 255.0 - 127.0);
          let plane = pickData.plane;
          let isAtPlaneBool = length(plane.xyz) > 0.1 && isAtPlane(plane);
          if(isAtPlaneBool){
            label = f32(index);
            wColor.x = 0.5;
            wColor.y = 0.1;
            wColor.z = 0.1;
          }
        }
      }

      cclBuffer[index] = label;
      textureStore(outTex, fragCoord , wColor);
    }

    fn isAtPlane(plane:vec4<f32>) -> bool{
      let pos = wPosition;
      let normal = wNormal;
      let dotValue1 = dot( plane.xyz, pos );
      let dotValue2 = dot(plane.xyz, normal);
      return abs(dotValue1 - plane.w) < 0.5 && dotValue2 > 0.95;
  }

  `