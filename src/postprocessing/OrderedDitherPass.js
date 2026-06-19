import { ShaderMaterial, UniformsUtils } from "three";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { OrderedDitherShader } from "./OrderedDitherShader.js";

/**
 * Post-processing pass adapted from
 * https://github.com/samwhitford/threejs-ordered-dithering-effect (MIT)
 */
export class OrderedDitherPass extends Pass {
  constructor(thresholdMapSize, scale) {
    super();

    const shader = OrderedDitherShader;
    this.uniforms = UniformsUtils.clone(shader.uniforms);
    this.uniforms.thresholdMapSize.value = thresholdMapSize ?? 4;
    this.uniforms.scale.value = scale ?? 1;

    this.material = new ShaderMaterial({
      name: shader.name,
      uniforms: this.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
    });

    this.fsQuad = new FullScreenQuad(this.material);
  }

  render(renderer, writeBuffer, readBuffer) {
    this.uniforms.tDiffuse.value = readBuffer.texture;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this.fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
      this.fsQuad.render(renderer);
    }
  }

  dispose() {
    this.material.dispose();
    this.fsQuad.dispose();
  }
}
