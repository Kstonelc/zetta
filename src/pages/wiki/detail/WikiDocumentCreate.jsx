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
  ScrollArea,
  Accordion,
  NumberInput,
  Chip,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import {
  ArrowLeft,
  ArrowRight,
  ChartScatter,
  Cog,
  Eye,
  ScanEye,
  TextQuote,
  Trash2,
} from "lucide-react";
import FileUpload from "/file-upload.svg";
import { useNavigate } from "react-router-dom";
import React, { useRef, useState } from "react";
import { useNotify } from "@/utils/notify.js";
import appHelper from "@/AppHelper.js";
import { FileType, WikiChunkType } from "@/enum.js";
import classes from "@/pages/wiki/wikiCreate/WikiCreate.module.scss";
import { Loading, Select } from "@/components/index.js";
import WikiChunkPreview from "@/pages/wiki/wikiCreate/WikiChunkPreview.jsx";

const WikiDocumentCreate = () => {
  const nav = useNavigate();
  const { notify } = useNotify();
  const theme = useMantineTheme();

  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const currentUploadedFilesRef = useRef([]);

  const nextStep = () =>
    setCurrentStep((current) => (current < 3 ? current + 1 : current));
  const prevStep = () =>
    setCurrentStep((current) => (current > 0 ? current - 1 : current));

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
      {currentStep === 1 && (
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
              <Image src={FileUpload} w={100} h={50} />
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
              onClick={() => {
                nextStep();
              }}
            >
              下一步
            </Button>
          </Group>
        </Stack>
      )}

      {currentStep === 2 && (
        <Group h={"calc(100vh - 180px)"}>
          <Card withBorder h={"100%"} flex={1}>
            <Stack justify={"space-between"} h={"100%"}>
              <ScrollArea mb={"md"}>
                <Card shadow="xs" mb={"md"}>
                  <Group gap={"xs"} mb={"md"} justify={"space-between"}>
                    <Text size={"sm"} fw={"bold"}>
                      分段配置
                    </Text>
                    <Group>
                      <Button
                        size={"xs"}
                        onClick={() => {}}
                        leftSection={<Eye size={16} />}
                      >
                        预览
                      </Button>
                    </Group>
                  </Group>
                  <Accordion
                    defaultValue={WikiChunkType.text[WikiChunkType.Classical]}
                    variant="separated"
                    onChange={(value) => {}}
                  >
                    <Accordion.Item
                      value={WikiChunkType.text[WikiChunkType.Classical]}
                    >
                      <Accordion.Control
                        value={WikiChunkType.text[WikiChunkType.Classical]}
                      >
                        <Group>
                          <Cog w={20} h={20} color={theme.colors.violet[6]} />
                          <div>
                            <Text size={"sm"}>经典模式</Text>
                            <Text size={"xs"} c={"dimmed"}>
                              直接按固定长度或规则切块
                            </Text>
                          </div>
                        </Group>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Group grow mb={"md"}>
                          <NumberInput
                            defaultValue={1024}
                            onChange={(value) => {}}
                            description={"分段预估长度(字符)"}
                          />
                          <NumberInput
                            defaultValue={50}
                            description={"分段重叠长度(字符)"}
                            onChange={(value) => {}}
                          />
                        </Group>
                      </Accordion.Panel>
                    </Accordion.Item>
                    <Accordion.Item
                      value={WikiChunkType.text[WikiChunkType.ParentChild]}
                    >
                      <Accordion.Control
                        value={WikiChunkType.text[WikiChunkType.ParentChild]}
                      >
                        <Group>
                          <TextQuote
                            w={20}
                            h={20}
                            color={theme.colors.yellow[6]}
                          />
                          <div>
                            <Text size={"sm"}>父子模式</Text>
                            <Text size={"xs"} c={"dimmed"}>
                              先按大块保留上下文，再在内部切小块用于精确检索
                            </Text>
                          </div>
                        </Group>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Text size={"sm"} fw={"bold"} mb={"xs"}>
                          父分段
                        </Text>
                        <Group grow mb={"md"}>
                          <NumberInput
                            defaultValue={1000}
                            onChange={(value) => {}}
                            description={"父分段预估长度(字符)"}
                          />
                          <NumberInput
                            defaultValue={100}
                            onChange={(value) => {}}
                            description={"父段长度(字符)重叠"}
                          />
                        </Group>
                        <Text size={"sm"} fw={"bold"} mb={"xs"}>
                          子分段
                        </Text>
                        <Group grow mb={"md"}>
                          <NumberInput
                            defaultValue={400}
                            onChange={(value) => {}}
                            description={"子分段预估长度(字符)"}
                          />
                          <NumberInput
                            defaultValue={50}
                            onChange={(value) => {}}
                            description={"子分段重叠长度(字符)"}
                          />
                        </Group>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                </Card>
                <Group gap={"xs"} grow align={"flex-start"}>
                  <Card shadow="xs" mb={"md"}>
                    <Group gap={"xs"} mb={"md"}>
                      <ChartScatter
                        w={16}
                        h={16}
                        color={theme.colors.green[6]}
                      ></ChartScatter>
                      <Text size={"sm"} fw={"bold"}>
                        向量化模型
                      </Text>
                    </Group>
                    <Select description={"Embedding模型"} defaultValue={""} />
                  </Card>
                  <Card shadow="xs">
                    <Group gap={"xs"} mb={"md"}>
                      <ScanEye
                        color={theme.colors.blue[6]}
                        w={16}
                        h={16}
                      ></ScanEye>
                      <Text size={"sm"} fw={"bold"}>
                        向量重排检索
                      </Text>
                    </Group>
                    <Select
                      mb={"sm"}
                      description={"Rerank模型"}
                      placeholder={"请选择Rerank模型"}
                    />
                    <Group grow>
                      <NumberInput
                        defaultValue={5}
                        description={"TopK"}
                      ></NumberInput>
                      <NumberInput
                        min={0}
                        max={1}
                        step={0.1}
                        defaultValue={0.5}
                        description={"Score(匹配程度)"}
                      ></NumberInput>
                    </Group>
                  </Card>
                </Group>
              </ScrollArea>
              <Group>
                <Button variant={"subtle"} onClick={prevStep}>
                  上一步
                </Button>
                <Button onClick={async () => {}}>保存并处理</Button>
              </Group>
            </Stack>
          </Card>
          <Card withBorder h={"100%"} flex={1}>
            <ScrollArea type={"auto"} style={{ height: "100%" }} pr={"sm"}>
              <Text size={"sm"} fw={"bold"} mb={"md"}>
                预览分块
              </Text>
              <Group mb={"sm"}>
                <Select
                  w={300}
                  defaultValue={uploadedFiles.map((file) => file.fileName)[0]}
                  data={uploadedFiles.map((file) => {
                    return {
                      label: file.fileName,
                      value: file.fileName,
                      icon: FileType.icon[FileType.getFileType(file.fileExt)],
                    };
                  })}
                />
                <Chip
                  color={theme.colors.blue[6]}
                  variant="light"
                  size={"xs"}
                  checked={true}
                >
                  {/*{appHelper.getLength(chunks)}个预览块*/}
                </Chip>
              </Group>
              {/*<Loading visible={isPreviewingChunks} size={"sm"}>*/}
              {/*  {appHelper.getLength(chunks) === 0 && <Stack h={"400"}></Stack>}*/}
              {/*  <WikiChunkPreview*/}
              {/*    chunks={chunks}*/}
              {/*    chunkType={currentWikiChunkTypeRef.current}*/}
              {/*    theme={theme}*/}
              {/*  />*/}
              {/*</Loading>*/}
            </ScrollArea>
          </Card>
        </Group>
      )}
    </Stack>
  );
};

export { WikiDocumentCreate };
