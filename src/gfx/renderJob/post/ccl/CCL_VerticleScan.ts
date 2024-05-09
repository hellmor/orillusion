export let CCL_VerticalScan: string = /*wgsl*/ `

    struct CCLUniformStruct{
      plane:vec4<f32>,
      coordX:f32,
      coordY:f32,
      meshID:f32,
      imageWidth:f32,
      imageHeight:f32,
      gridCount:f32,
      activePost:f32,
      slot0:f32,
    } 

    @group(0) @binding(0) var<uniform> cclUniformData: CCLUniformStruct;
    @group(0) @binding(1) var<storage, read_write> cclBuffer : array<f32>;
    
    var<private> texSize: vec2<u32>;
    var<private> texSizeI32: vec2<i32>;
    var<private> fragCoord: vec2<i32>;
    
    @compute @workgroup_size( 8 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
      fragCoord = vec2<i32>( globalInvocation_id.xy );
      texSize = vec2<u32>(u32(cclUniformData.imageWidth), u32(cclUniformData.imageHeight));
      texSizeI32 = vec2<i32>( texSize );
      if(fragCoord.x >= texSizeI32.x){
          return;
      }

      var index0 = getIndex(fragCoord.x, 0);
      var label0 = cclBuffer[index0];
      var label1 = 0.0;
      var index1 = 0;
      for(var y:i32 = 1; y < texSizeI32.y; y ++){
        index1 = getIndex(fragCoord.x, y);
        label1 = cclBuffer[index1];

        if(label0 > -0.5 && label1 > -0.5){
          cclBuffer[index1] = label0;
          label1 = label0;
        }

        index0 = index1;
        label0 = label1;
      }
    }

    fn getIndex(coordX:i32, coordY:i32) -> i32
    {
      if(coordX < 0 || coordX >= texSizeI32.x || coordY < 0 || coordY >= texSizeI32.y){
        return -1;
      }
      return coordY * texSizeI32.x + coordX;
    }

  `