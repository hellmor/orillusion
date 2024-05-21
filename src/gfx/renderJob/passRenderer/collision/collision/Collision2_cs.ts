export let Collision_cover: string = /*wgsl*/ `

    struct CollisionSetting{
      width:f32,
      height:f32,
      maxCount:f32,
      srcCount:f32,
    } 

    @group(0) @binding(0) var<uniform> settingData: CollisionSetting;
    @group(0) @binding(1) var<storage, read_write> srcIds : array<f32>;
    @group(0) @binding(2) var<storage, read_write> dstIds : array<f32>;
    @group(0) @binding(3) var mainTex : texture_2d<f32>;
    @group(0) @binding(4) var subTex : texture_2d<f32>;
    
    var<private> texSize: vec2<u32>;
    var<private> texSizeI32: vec2<i32>;
    var<private> fragCoord: vec2<i32>;
    var<private> mainMeshID:i32 = -1;
    var<private> subMeshID:i32 = -1;
    var<private> subColor:vec4<f32>;
    var<private> mainColor:vec4<f32>;
    
    @compute @workgroup_size( 8 , 8, 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {

        fragCoord = vec2<i32>( globalInvocation_id.xy );
        texSize = vec2<u32>(u32(settingData.width), u32(settingData.height));
        texSizeI32 = vec2<i32>( texSize );

        if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
            return;
        }

        subColor =  textureLoad(subTex, fragCoord, 0);
        subMeshID = convertMeshID(subColor.w);

        if(subMeshID <= 0){
            return;
        }

        mainColor =  textureLoad(mainTex, fragCoord, 0);
        mainMeshID = convertMeshID(mainColor.w);
       if(mainMeshID <= 0 || mainMeshID == subMeshID){
            return;
        }

        let meshID_label = findLabel(mainMeshID);
        //寻找对应的Ids下标
        if(meshID_label >= 0){
            dstIds[meshID_label] = f32(mainMeshID);//被它覆盖
        }
    }
   
    fn findLabel(meshID:i32) -> i32
    {
        let srcCount = i32(round(settingData.srcCount));
        for(var i:i32 = 0; i < srcCount; i ++){
            if(i32(round(srcIds[i])) == meshID){
                return i;
            }
        }
        return -1;
    }

    fn convertMeshID(w:f32) -> i32
    {
      return i32(round(w));
    }

  `