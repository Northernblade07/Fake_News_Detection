import {
  DOMMatrix,
  ImageData,
  Path2D,
  createCanvas,
} from "@napi-rs/canvas";

/**
 * Polyfill browser graphics APIs required by pdfjs-dist
 * for Node.js environments (Docker, Render, AWS).
 */

(globalThis as any).DOMMatrix ??= DOMMatrix;
(globalThis as any).ImageData ??= ImageData;
(globalThis as any).Path2D ??= Path2D;

(globalThis as any).document ??= {
  createElement: () => createCanvas(1, 1),
};