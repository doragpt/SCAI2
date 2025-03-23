declare module 'quill-image-resize-module-react' {
  import Quill from 'quill';
  
  interface ImageResizeModuleOptions {
    modules?: string[];
    parchment?: any;
    handleStyles?: {
      minWidth?: number;
      maxWidth?: number;
      displaySize?: boolean;
      attributors?: {
        width?: string;
        height?: string;
      }
    };
  }
  
  export default class ImageResize {
    constructor(quill: Quill, options: ImageResizeModuleOptions);
  }
}