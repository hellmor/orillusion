import { LambertMaterial, RenderShaderPass, PassType, Vector4, Color, Engine3D, ShaderLib, Shader } from "@orillusion/core";
import { StencilSliceShader } from "./StencilSliceShader";
import { ToothClipTag } from "./ToothClipTag";

export class StencilSliceMaterial extends LambertMaterial {
    private _colorPass: RenderShaderPass;
    private _clipData: Float32Array;

    constructor() {
        super();
        let toothShader = 'StencilSliceShader';
        ShaderLib.register(toothShader, StencilSliceShader);
        let colorPass = new RenderShaderPass(toothShader, toothShader);
        colorPass.setShaderEntry(`VertMain`, `FragMain`);
        colorPass.passType = PassType.COLOR;
        colorPass.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformColor(`baseColor`, new Color(1, 1, 1, 1));
        this._clipData = new Float32Array([0, 0, 0, 0]);
        colorPass.setUniformArray('clipData', this._clipData);

        let shaderState = colorPass.shaderState;
        shaderState.acceptShadow = false;
        shaderState.castShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;

        let newShader = new Shader();
        newShader.addRenderPass(colorPass);
        newShader.setDefine('CLIP_MODEL_PLANE', true);
        this.shader = newShader;
        this.baseMap = Engine3D.res.grayTexture;

        this._colorPass = colorPass;
    }

    public setClipEnable(value: ToothClipTag) {
        this._clipData[0] = value;
        this._colorPass.setUniformArray('clipData', this._clipData);
    }

    public getClipEnable() {
        return this._clipData[0];
    }

    public setClipPosition(value: number) {
        this._clipData[1] = value;
        this._colorPass.setUniformArray('clipData', this._clipData);
    }

    public getClipPosition() {
        return this._clipData[1];
    }
}