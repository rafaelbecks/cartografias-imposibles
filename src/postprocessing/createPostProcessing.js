import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OrderedDitherPass } from "./OrderedDitherPass.js";
import { clampOrderedDitherParams, orderedDitherParams } from "./orderedDitherParams.js";

/**
 * GPU ordered-dither pipeline via EffectComposer.
 * Separate from the SVG dither overlay — both can run at once for experimentation.
 */
export function createPostProcessing(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const ditherPass = new OrderedDitherPass(
    orderedDitherParams.mapSize,
    orderedDitherParams.scale
  );
  composer.addPass(ditherPass);

  function sync() {
    clampOrderedDitherParams();
    ditherPass.uniforms.thresholdMapSize.value = orderedDitherParams.mapSize;
    ditherPass.uniforms.scale.value = orderedDitherParams.scale;
  }

  function isActive() {
    return orderedDitherParams.enabled;
  }

  function setSize(width, height) {
    composer.setSize(width, height);
  }

  function render() {
    sync();
    composer.render();
  }

  sync();

  return {
    composer,
    ditherPass,
    render,
    setSize,
    sync,
    isActive,
  };
}
