import {
  Stack,
  Text,
  Group,
  Button,
  Title,
  Divider,
  Image,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { ArrowLeft, ArrowRight } from "lucide-react";
import InBox from "/inbox.svg";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { useNotify } from "@/utils/notify.js";

const WikiDocumentCreate = () => {
  const nav = useNavigate();
  const { notify } = useNotify();

  const [isUploading, setIsUploading] = useState(false);

  return (
    <Stack p={"lg"} flex={1} gap={"xs"}>
      <Group justify={"space-between"} mb={"0"}>
        <Button
          variant={"light"}
          leftSection={<ArrowLeft size={16} />}
          onClick={() => {
            nav(-1);
          }}
        >
          返回知识库
        </Button>
      </Group>
      <Divider mb={"xl"}></Divider>
      <Stack px={"100"}>
        <Title order={4}>上传文档</Title>
        <Dropzone
          onDrop={async (files) => {
            setIsUploading(true);
            // await onUploadFile(files);
          }}
          onReject={(files) => {
            for (const file of files) {
              notify({
                type: "error",
                message: `${file.file.name} - ${file.errors[0].message}`,
              });
            }
          }}
          loading={isUploading}
          maxSize={10 * 1024 * 1024}
          maxFiles={5}
          accept={{
            "text/markdown": [".md", ".markdown"],
            "text/plain": [".md", ".markdown", ".txt"],
            // PDF
            "application/pdf": [".pdf"],

            // Word（.doc / .docx）
            "application/msword": [".doc"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
              [".docx"],
          }}
          mb={"sm"}
          miw={300}
          maw={600}
        >
          <Group justify="center" gap="xl" mih={150}>
            <Image src={InBox} w={50} h={50} />
            <div>
              <Text inline mb={"sm"}>
                拖拽或点击文件上传
              </Text>
              <Text size={"xs"} c={"dimmed"}>
                每个文件不超过10M, 支持md, markdown,doc, docx, pdf
                最多每次上传10个文件
              </Text>
            </div>
          </Group>
        </Dropzone>
        <Group>
          <Button leftSection={<ArrowRight size={16} />}>下一步</Button>
        </Group>
      </Stack>
    </Stack>
  );
};

export { WikiDocumentCreate };
