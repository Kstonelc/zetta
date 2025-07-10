import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ImageUploadComponent from "./ImageUploadComponent"; // 自定义组件

export const ImageUploader = Node.create({
  name: "imageUploader",

  group: "block",

  atom: true,

  parseHTML() {
    return [
      {
        tag: "image-uploader",
      },
    ];
  },

  renderHTML() {
    return ["image-uploader", {}];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageUploadComponent);
  },
});
