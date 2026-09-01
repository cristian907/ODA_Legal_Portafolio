declare module 'dom-to-image-more' {
  export interface Options {
    filter?: (node: Node) => boolean;
    bgcolor?: string;
    width?: number;
    height?: number;
    style?: {};
    quality?: number;
    imagePlaceholder?: string;
    cacheBust?: boolean;
    scale?: number;
  }
  export function toJpeg(node: Node, options?: Options): Promise<string>;
  export function toPng(node: Node, options?: Options): Promise<string>;
  export function toBlob(node: Node, options?: Options): Promise<Blob>;
  export function toPixelData(node: Node, options?: Options): Promise<Uint8ClampedArray>;
  
  const domtoimage: {
    toJpeg: typeof toJpeg;
    toPng: typeof toPng;
    toBlob: typeof toBlob;
    toPixelData: typeof toPixelData;
  };
  export default domtoimage;
}
