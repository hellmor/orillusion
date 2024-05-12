export let CCL_BorderLinkRedirect: string = /*wgsl*/ `

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

    struct LinkMap
    {
      min:i32,
      count:i32,
      labels:array<i32, 1022u>
    }

    @group(0) @binding(0) var<uniform> cclUniformData: CCLUniformStruct;
    @group(0) @binding(1) var<storage, read_write> borderLinkBuffer : array<f32>;
    @group(0) @binding(2) var<storage, read_write> labelRedirectBuffer : array<f32>;
    
    var<private> texSize: vec2<u32>;
    var<private> texSizeI32: vec2<i32>;
    var<private> fragCoord: vec2<i32>;
    
    @compute @workgroup_size( 8, 8, 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
      fragCoord = vec2<i32>( globalInvocation_id.xy );
      texSize = vec2<u32>(u32(cclUniformData.imageWidth), u32(cclUniformData.imageHeight));
      texSizeI32 = vec2<i32>( texSize );
      if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
          return;
      }
      let index = fragCoord.x + fragCoord.y * i32(texSize.x);

      var lbMax = i32(borderLinkBuffer[index * 2]);
      var lbMin = i32(borderLinkBuffer[index * 2 + 1]);

      if(lbMax != -1 && lbMin != -1){
        recordLinkLabel(lbMax, lbMin);
      }
    }

    fn recordLinkLabel(lbMax:i32, lbMin:i32)
    {
      var map: LinkMap;
      map.min = lbMin;
      map.count = 2;
      map.labels[0] = lbMax;
      map.labels[1] = lbMin;
      //
      let maxIndex = texSizeI32.x * texSizeI32.y;
      var lastCount = 0;

      while(lastCount != map.count){
        lastCount = map.count;
        for(var i = 0; i < maxIndex; i ++ ){
          var head = i32(borderLinkBuffer[i * 2]);
          var tail = i32(borderLinkBuffer[i * 2 + 1]);
          
          if(head == -1 || tail == -1){
            break;
          }
          
          //判断是否该链接关系在labels中
          var isHeadIn = false;
          var isTailIn = false;
          for(var j = 0; j < map.count; j ++){
            let lb = map.labels[j];
  
            if(lb == head){
              isHeadIn = true;
            }
            if(lb == tail){
              isTailIn = true;
            }
  
            if(isHeadIn && isTailIn){
              break;
            }
          }
  
          //发现有一个在已有数组里
          if(isHeadIn != isTailIn){
            if(isHeadIn){
              map.labels[map.count] = tail;
              map.min = min(map.min, tail);
            }else{
              map.labels[map.count] = head;
            }
            map.count = map.count + 1;
            break;
          }
        }
      }
      labelRedirectBuffer[lbMax] = f32(map.min);
    }

  `