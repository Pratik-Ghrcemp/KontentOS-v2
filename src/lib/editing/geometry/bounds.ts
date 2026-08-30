import { TimelineItem } from '../types';
import { Point, Size, BoundingBox, RotatedRect } from './types';
import { rotatePointAroundCenter } from './transforms';

/**
 * Calculates raw width and height size of a timeline item.
 */
export function getItemSize(item: TimelineItem, defaultCanvasWidth = 320, defaultCanvasHeight = 180): Size {
  const props = item.properties || {};

  if (item.type === 'video') {
    const scaleVal = (props.scale ?? 100) / 100;
    return {
      width: defaultCanvasWidth * scaleVal,
      height: defaultCanvasHeight * scaleVal
    };
  }

  if (item.type === 'text') {
    const fontSize = props.fontSize || 32;
    const textLen = (item.content || item.label || 'Text Overlay').length;
    return {
      width: Math.max(textLen * fontSize * 0.6 + 20, 80),
      height: fontSize * 1.3 + 12
    };
  }

  return { width: 100, height: 60 };
}

/**
 * Calculates 4 rotated corner coordinates for an item in canvas space.
 */
export function getRotatedCorners(item: TimelineItem, defaultCanvasWidth = 320, defaultCanvasHeight = 180): RotatedRect {
  const props = item.properties || {};
  const center: Point = { x: props.x || 0, y: props.y || 0 };
  const size = getItemSize(item, defaultCanvasWidth, defaultCanvasHeight);
  const rotation = props.rotation || 0;

  const halfW = size.width / 2;
  const halfH = size.height / 2;

  const unrotatedCorners: Point[] = [
    { x: center.x - halfW, y: center.y - halfH }, // Top-Left
    { x: center.x + halfW, y: center.y - halfH }, // Top-Right
    { x: center.x + halfW, y: center.y + halfH }, // Bottom-Right
    { x: center.x - halfW, y: center.y + halfH }  // Bottom-Left
  ];

  const corners = unrotatedCorners.map(pt => rotatePointAroundCenter(pt, center, rotation));

  return {
    center,
    width: size.width,
    height: size.height,
    rotation,
    corners
  };
}

/**
 * Calculates outer axis-aligned bounding box enclosing a single rotated item.
 */
export function getItemBounds(item: TimelineItem, defaultCanvasWidth = 320, defaultCanvasHeight = 180): BoundingBox {
  const rect = getRotatedCorners(item, defaultCanvasWidth, defaultCanvasHeight);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  rect.corners.forEach(pt => {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  });

  const width = Math.max(maxX - minX, 10);
  const height = Math.max(maxY - minY, 10);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
}

/**
 * Calculates unified combined bounding box enclosing multiple selected timeline items.
 */
export function getGroupBounds(selectedItems: TimelineItem[], defaultCanvasWidth = 320, defaultCanvasHeight = 180): BoundingBox | null {
  if (selectedItems.length === 0) return null;
  if (selectedItems.length === 1) return getItemBounds(selectedItems[0], defaultCanvasWidth, defaultCanvasHeight);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  selectedItems.forEach(item => {
    const rect = getRotatedCorners(item, defaultCanvasWidth, defaultCanvasHeight);
    rect.corners.forEach(pt => {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    });
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;

  const width = Math.max(maxX - minX, 20);
  const height = Math.max(maxY - minY, 20);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
}
