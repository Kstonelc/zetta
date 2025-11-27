import {
  Stack,
  Text,
  Group,
  Button,
  Title,
  Divider,
  Image,
  Card,
  Stepper,
  ActionIcon,
  useMantineTheme,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import InBox from "/inbox.svg";
import { useNavigate } from "react-router-dom";
import React, { useRef, useState } from "react";
import { useNotify } from "@/utils/notify.js";
import appHelper from "@/AppHelper.js";
import { FileType } from "@/enum.js";
import classes from "@/pages/wiki/wikiCreate/WikiCreate.module.scss";

const WikiDocumentCreate = () => {
  const nav = useNavigate();
  const { notify } = useNotify();
  const theme = useMantineTheme();

  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const currentUploadedFilesRef = useRef([]);

  // region 方法
  const onUploadFile = async (files) => {
    const fileMap = new Map();
    for (const file of files) {
      const response = await appHelper.apiPost("/wiki/upload-file", file);
      if (!response.ok) {
        notify({
          type: "error",
          message: response.message,
        });
      } else {
        const fileInfo = response.data;
        const fileName = fileInfo.fileName;
        fileMap.set(fileName, fileInfo);
      }
    }
    const results = Array.from(fileMap.values());
    setUploadedFiles((prev) => {
      const prevMap = new Map();
      for (const item of prev) {
        if (!fileMap.has(item.fileName)) {
          prevMap.set(item.fileName, item);
        }
      }
      currentUploadedFilesRef.current = [...prevMap.values(), ...results];
      return currentUploadedFilesRef.current;
    });
    setIsUploading(false);
  };

  const onDeleteFile = (fileName) => {
    setUploadedFiles((prev) => {
      currentUploadedFilesRef.current = prev.filter(
        (item) => item.fileName !== fileName,
      );
      return prev.filter((item) => item.fileName !== fileName);
    });
  };

  // endregion

  // region 组件渲染
  const renderFileIcon = (fileExt) => {
    return (
      <Image src={FileType.icon[FileType.getFileType(fileExt)]} w={20} h={20} />
    );
  };

  const renderUploadedFiles = () => {
    if (appHelper.getLength(uploadedFiles) > 0) {
      return uploadedFiles.map((file, index) => {
        const fileType = FileType.getFileType(file.fileExt);
        let fileSize = file.fileSize;
        fileSize = appHelper.getFileSize(fileSize);
        return (
          <Card miw={300} maw={600} withBorder p={"xs"} mb={"xs"} key={index}>
            <Group justify={"space-between"}>
              <Group gap={"sm"}>
                {renderFileIcon(file.fileExt)}
                <div>
                  <Text size={"xs"} fw={"bold"}>
                    {file.fileName}
                  </Text>
                  <Text size={"xs"} c={"dimmed"}>
                    {FileType.text[fileType]}&nbsp;&nbsp;{fileSize}
                  </Text>
                </div>
              </Group>
              <ActionIcon
                variant={"subtle"}
                size={"sm"}
                color={theme.colors.gray[6]}
                onClick={() => {
                  onDeleteFile(file.fileName);
                }}
              >
                <Trash2 size={16} />
              </ActionIcon>
            </Group>
          </Card>
        );
      });
    }
  };

  // endregion

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
        <Stepper
          iconSize={24}
          active={currentStep}
          allowNextStepsSelect={false}
          size={"xs"}
          className={classes.absoluteCenter}
          miw={500}
        >
          <Stepper.Step label="数据上传" />
          <Stepper.Step label="数据分段" />
          <Stepper.Step label="数据处理" />
        </Stepper>
      </Group>
      <Divider mb={"xl"}></Divider>
      <Stack px={"100"}>
        <Title order={4}>上传文档</Title>
        <Dropzone
          onDrop={async (files) => {
            setIsUploading(true);
            await onUploadFile(files);
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
        {renderUploadedFiles()}
        <Group>
          <Button
            leftSection={<ArrowRight size={16} />}
            disabled={appHelper.getLength(uploadedFiles) === 0}
          >
            下一步
          </Button>
        </Group>
      </Stack>
    </Stack>
  );
};

export { WikiDocumentCreate };
