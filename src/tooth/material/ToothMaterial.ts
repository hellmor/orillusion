import { LambertMaterial, RenderShaderPass, PassType, Vector4, Color, Shader, Engine3D, Plane3D, ShaderLib, Tooth_Shader, ToothMaterialUniform_frag } from "../..";

export enum ToothClipTag {
    None = 0,
    Positive = 1,
    Negative = 2,
}
/**
 * Lambert Mateiral
 * A non glossy surface material without specular highlights.
 * @group Material
 */
export class ToothMaterial extends LambertMaterial {

    private _planes: Plane3D[];
    private _colorPass: RenderShaderPass;
    private _enableClipTags: Float32Array;
    private _clipPlanesData: Float32Array;
    private _backFaceColor: Color;
    private readonly PlaneCount = 4;
    constructor() {
        super();
        ShaderLib.register('Tooth_Shader', Tooth_Shader);
        ShaderLib.register('ToothMaterialUniform_frag', ToothMaterialUniform_frag);

        let colorPass = new RenderShaderPass(`Tooth_Shader`, `Tooth_Shader`);
        colorPass.setShaderEntry(`VertMain`, `FragMain`);
        colorPass.passType = PassType.COLOR;
        colorPass.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformColor(`baseColor`, new Color(1, 1, 1, 1));
        this._backFaceColor = new Color(0.8, 0.2, 0.2, 1.0);
        colorPass.setUniformColor(`backFaceColor`, this._backFaceColor);

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
        this.initClipPlanes();
    }

    private initClipPlanes() {
        this._planes = [];
        for (let i = 0; i < this.PlaneCount; i++) {
            this._planes.push(new Plane3D(0, 1, 0, 0));
        }

        this._enableClipTags = new Float32Array([0, 0, 0, 0]);
        this._colorPass.setUniformArray('enableClipTags', this._enableClipTags);

        this._clipPlanesData = new Float32Array([0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0]);
        this._colorPass.setUniformArray('clipPlanesData', this._clipPlanesData);
    }

    public setClipEnable(index: number, value: ToothClipTag) {
        this._enableClipTags[index] = value;
        this._colorPass.setUniformArray('enableClipTags', this._enableClipTags);
    }

    public getClipEnable(index: number) {
        return this._enableClipTags[index];
    }

    public set clipPlanes(value: Plane3D[]) {
        if (!this._planes) {
            this.initClipPlanes();
        }
        for (let i = 0; i < this.PlaneCount; i++) {
            let src = value?.[i];
            if (src) {
                this._planes[i].setTo(src.a, src.b, src.c, src.d);
            } else {
                this._planes[i].setTo(0, 1, 0, 0);
            }
        }

        for (let i = 0; i < this.PlaneCount; i++) {
            let offset = i * 4;
            let plane = this._planes[i];
            this._clipPlanesData[offset] = plane.a;
            this._clipPlanesData[offset + 1] = plane.b;
            this._clipPlanesData[offset + 2] = plane.c;
            this._clipPlanesData[offset + 3] = plane.d;
        }
        this._colorPass.setUniformArray('clipPlanesData', this._clipPlanesData);
    }

    public get clipPlanes() {
        return this._planes?.slice();
    }

    public get backFaceColor() {
        return this._backFaceColor;
    }

    public set backFaceColor(value: Color) {
        this._backFaceColor.copyFrom(value);
        this._colorPass.setUniformColor(`backFaceColor`, this._backFaceColor);
    }
}