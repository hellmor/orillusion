import { Engine3D } from '../../Engine3D';
import { RenderShaderPass } from '../../gfx/graphics/webGpu/shader/RenderShaderPass';
import { PassType } from '../../gfx/renderJob/passRenderer/state/RendererType';
import { Color } from '../../math/Color';
import { BlendMode } from '../BlendMode';

/**
 * @internal
 * CollisionQueryMaterialPass
 * @group Material
 */
export class CollisionQueryMaterialPass extends RenderShaderPass {
    constructor() {
        super(`collision_shader`, `collision_shader`);
        this.setShaderEntry(`VertMain`, `FragMain`)
        this.passType = PassType.COLLISION;

        this.setUniformColor(`baseColor`, new Color());
        this.blendMode = BlendMode.NONE;
        this.setTexture(`normalMap`, Engine3D.res.normalTexture);
    }
}
