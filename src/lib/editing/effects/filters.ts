import { ColorGradingProperties } from './types';
import { CINEMATIC_LUTS } from './presets';

/**
 * Pure utility to build a CSS filter string from item properties and LUT preset ID.
 */
export function generateCssFilter(props: ColorGradingProperties = {}, activeLutId = 'none'): string {
  const lutId = props.lutId || activeLutId;
  const lutFilter = CINEMATIC_LUTS[lutId]?.cssFilter || '';

  const filterParts: string[] = [];

  if (lutFilter) {
    filterParts.push(lutFilter);
  }

  if (props.brightness !== undefined && props.brightness !== 100) {
    filterParts.push(`brightness(${(props.brightness / 100).toFixed(2)})`);
  }

  if (props.contrast !== undefined && props.contrast !== 100) {
    filterParts.push(`contrast(${(props.contrast / 100).toFixed(2)})`);
  }

  if (props.saturation !== undefined && props.saturation !== 100) {
    filterParts.push(`saturate(${(props.saturation / 100).toFixed(2)})`);
  }

  if (props.exposure !== undefined && props.exposure !== 0) {
    const expFactor = 1 + (props.exposure / 100);
    filterParts.push(`brightness(${Math.max(0.2, expFactor).toFixed(2)})`);
  }

  if (props.hue !== undefined && props.hue !== 0) {
    filterParts.push(`hue-rotate(${props.hue}deg)`);
  }

  if (props.blur !== undefined && props.blur > 0) {
    filterParts.push(`blur(${props.blur}px)`);
  }

  if (props.sepia !== undefined && props.sepia > 0) {
    filterParts.push(`sepia(${(props.sepia / 100).toFixed(2)})`);
  }

  if (props.grayscale !== undefined && props.grayscale > 0) {
    filterParts.push(`grayscale(${(props.grayscale / 100).toFixed(2)})`);
  }

  return filterParts.join(' ').trim();
}
