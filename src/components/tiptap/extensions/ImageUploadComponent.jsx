import { Dropzone } from "@mantine/dropzone";
import { Text, Group } from "@mantine/core";

export default function ImageUploadComponent({ editor, getPos }) {
  const handleUpload = async (file) => {
    // 1. 上传图片（可接入 S3、OSS、Cloudinary）
    const url = await fakeUpload(file);

    // 2. 替换当前节点为图片
    editor
      .chain()
      .focus()
      .deleteRange({ from: getPos(), to: getPos() + 1 }) // 删除当前节点
      .insertContent(`<img src="${url}" />`)
      .run();
  };

  return (
    <Dropzone
      onDrop={(files) => {
        if (files.length) {
          handleUpload(files[0]);
        }
      }}
      mah={200}
      maw={500}
      p={"md"}
      multiple={false}
    >
      <Group justify="center" gap="xs" h={100}>
        <div>
          <Text size="sm">拖转或点击上传图片</Text>
        </div>
      </Group>
    </Dropzone>
  );
}

async function fakeUpload(file) {
  // mock 模拟上传
  await new Promise((r) => setTimeout(r, 1000));
  return URL.createObjectURL(file);
}
