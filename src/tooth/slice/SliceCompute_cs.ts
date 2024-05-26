export let Slice_compute_cs: string = /*wgsl*/ `

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

    @group(0) @binding(0) var<storage, read_write> outBuffer : array<f32>;
    @group(0) @binding(1) var<storage, read> indexBuffer : array<u32>;
    @group(0) @binding(2) var<storage, read> vertexBuffer : array<f32>;
    @group(0) @binding(3) var<uniform> worldMatrix: mat4x4<f32>;
    @group(0) @binding(4) var<uniform> sliceUniform: SliceSetting;


    var<private> origin:vec3<f32>;
    var<private> direction:vec3<f32> = vec3<f32>(0.0, 0.0, 1.0);
    var<private> dest:vec3<f32>;

    var<private> fragCoord: vec2<i32>;

    @compute @workgroup_size( 8, 8, 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
      fragCoord = vec2<i32>( globalInvocation_id.xy );
      let resolution:vec2<i32> = vec2<i32>(i32(round(sliceUniform.resolutionX)), i32(round(sliceUniform.resolutionY)));
      let index = fragCoord.x + fragCoord.y * i32(resolution.x);

      origin = vec3<f32>(f32(globalInvocation_id.x - resolution.x), f32(globalInvocation_id.y - resolution.y), 0.0);
      origin.x -= resolution.x * 0.5;
      origin.y -= resolution.y * 0.5;
     
      dest = vec3<f32>(origin.x, origin.y, sliceUniform.height);

      let triangleCount = u32(round(sliceUniform.triangleCount));
      var backFaceCount = 0u;
      var frontFaceCount = 0u;

      
      var triangleIdx = 0u;
      for(var triangleIdx:i32 = 0; triangleIdx < triangleIdx; triangleIdx ++){
        let idxOffset = triangleIdx * 3;
        let id0 = indexBuffer[idxOffset    ] * 3;
        let id1 = indexBuffer[idxOffset + 1 * 3];
        let id2 = indexBuffer[idxOffset + 2] * 3;
        
        var v0 = vec3<f32>(vertexBuffer[id0    ], vertexBuffer[id0 + 1], vertexBuffer[id0 + 2]);
        var v1 = vec3<f32>(vertexBuffer[id1 + 3], vertexBuffer[id1 + 4], vertexBuffer[id1 + 5]);
        var v2 = vec3<f32>(vertexBuffer[id2 + 6], vertexBuffer[id2 + 7], vertexBuffer[id2 + 8]);

        v0 = (worldMatrix * vec4<f32>(v0, 1.0)).xyz;
        v1 = (worldMatrix * vec4<f32>(v1, 1.0)).xyz;
        v2 = (worldMatrix * vec4<f32>(v2, 1.0)).xyz;
      }



      var sliceOp:f32 = 0.0;
      if(backFaceCount > 0 && frontFaceCount > 0){
        if(backFaceCount >= frontFaceCount){
          sliceOp = 1.0;
        }else{
          sliceOp = -1.0;
        }
      }else{
        sliceOp = 0.0;
      }

      outBuffer[index] = sliceOp;
      // outBuffer[0] = ccc;
    }

    fn intersectTriangle( a, b, c, backfaceCulling ) -> bool {

      // Compute the offset origin, edges, and normal.
  
      // from http://www.geometrictools.com/GTEngine/Include/Mathematics/GteIntrRay3Triangle3.h
  
      _edge1.subVectors( b, a );
      _edge2.subVectors( c, a );
      _normal$1.crossVectors( _edge1, _edge2 );
  
      // Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
      // E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
      //   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
      //   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
      //   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
      let DdN = this.direction.dot( _normal$1 );
      let sign;
  
      if ( DdN > 0 ) {
  
        if ( backfaceCulling ) return null;
        sign = 1;
  
      } else if ( DdN < 0 ) {
  
        sign = - 1;
        DdN = - DdN;
  
      } else {
  
        return null;
  
      }
  
      _diff.subVectors( this.origin, a );
      const DdQxE2 = sign * this.direction.dot( _edge2.crossVectors( _diff, _edge2 ) );
  
      // b1 < 0, no intersection
      if ( DdQxE2 < 0 ) {
  
        return null;
  
      }
  
      const DdE1xQ = sign * this.direction.dot( _edge1.cross( _diff ) );
  
      // b2 < 0, no intersection
      if ( DdE1xQ < 0 ) {
  
        return null;
  
      }
  
      // b1+b2 > 1, no intersection
      if ( DdQxE2 + DdE1xQ > DdN ) {
  
        return null;
  
      }
  
      // Line intersects triangle, check if ray does.
      const QdN = - sign * _diff.dot( _normal$1 );
  
      // t < 0, no intersection
      if ( QdN < 0 ) {
  
        return null;
  
      }
  
      // Ray intersects triangle.
      return at( QdN / DdN );
  
    }

    fn at( t:f32) -> vec3<f32>
    {
     return origin + direction * t;
    }
    
  `