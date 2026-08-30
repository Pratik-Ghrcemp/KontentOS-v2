export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface RotatedRect {
  center: Point;
  width: number;
  height: number;
  rotation: number; // In degrees
  corners: Point[];
}

export type CornerQuadrant = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
