import {
  Stack,
  Text,
  Group,
  Button,
  Title,
  Image,
  Card,
  Stepper,
  ActionIcon,
  useMantineTheme,
  ScrollArea,
  Accordion,
  NumberInput,
  Chip,
  Loader,
  Progress,
  Badge,
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
  ExternalLink,
  Album,
  CircleCheck,
  CircleX,
} from "lucide-react";
import FileUpload from "/file-upload.svg";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import { useNotify } from "@/utils/notify.js";
import appHelper from "@/AppHelper.js";
import {
  DocumentIndexStatus,
  FileType,
  ModelType,
  WikiChunkType,
} from "@/enum.js";
import classes from "@/pages/wiki/wikiCreate/WikiCreate.module.scss";
import { Loading, Select } from "@/components/index.js";
import WikiChunkPreview from "@/pages/wiki/wikiCreate/WikiChunkPreview.jsx";
import { useUserStore } from "@/stores/useUserStore.js";

const WikiDocumentCreate = () => {
  const nav = useNavigate();
  const { notify } = useNotify();
  const { userStore, setUserStore } = useUserStore();
  const { wikiId } = useParams();
  const theme = useMantineTheme();

  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [embeddingModels, setEmbeddingModels] = useState([]);
  const [rerankModels, setRerankModels] = useState([]);
  const [chunks, setChunks] = useState([]);
  const [isPreviewingChunks, setIsPreviewingChunks] = useState(false);
  const [documentIndexProgress, setDocumentIndexProgress] = useState(null);

  const currentWikiIdRef = useRef(null);
  const currentUploadedFilesRef = useRef([]);
  const currentWikiChunkTypeRef = useRef(null);
  const parentChunkSizeRef = useRef(1000);
  const parentChunkOverlapRef = useRef(100);
  const childChunkSizeRef = useRef(200);
  const childChunkOverlapRef = useRef(50);
  const defaultEmbeddingModelRef = useRef({});
  const defaultRerankModelRef = useRef({});
  const autoRefreshIndexProgressTimer = useRef(null);

  const nextStep = () =>
    setCurrentStep((current) => (current < 3 ? current + 1 : current));
  const prevStep = () =>
    setCurrentStep((current) => (current > 0 ? current - 1 : current));

  // region 初始化

  useEffect(() => {
    initialize();
    return () => {
      destroy();
    };
  }, []);

  const initialize = async () => {
    currentWikiIdRef.current = wikiId;
    await getWikiInfo();
    await getEmbeddingModels();
    await getRerankModels();
  };

  const destroy = async () => {};

  // endregion

  // region 方法
  const getWikiInfo = async () => {
    const response = await appHelper.apiPost("/wiki/find-wiki", {
      wikiId: wikiId,
    });
    if (!response.ok) {
      notify({
        type: "error",
        message: response.message,
      });
      return;
    }
    currentWikiChunkTypeRef.current = response.data.chunk_type;
    defaultEmbeddingModelRef.current = response.data.embedding_model;
    defaultRerankModelRef.current = response.data.rerank_model;
  };

  const getEmbeddingModels = async () => {
    const response = await appHelper.apiPost("model/find-models", {
      modelType: ModelType.TextEmbedding,
      tenantId: userStore.current_tenant.id,
    });
    if (!response.ok) {
      notify({
        type: "error",
        message: response.message,
      });
      return;
    }
    setEmbeddingModels(response.data);
  };

  const getRerankModels = async () => {
    const response = await appHelper.apiPost("model/find-models", {
      modelType: ModelType.ReRank,
      tenantId: userStore.current_tenant.id,
    });
    if (!response.ok) {
      notify({
        type: "error",
        message: response.message,
      });
      return;
    }
    setRerankModels(response.data);
  };

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

  const onPreviewChunks = async () => {
    setIsPreviewingChunks(true);
    const response = await appHelper.apiPost("/wiki/preview-file-chunks", {
      filePath: uploadedFiles[0].filePath,
      chunkType: currentWikiChunkTypeRef.current,
      parentChunkSize: parentChunkSizeRef.current,
      parentChunkOverlap: parentChunkOverlapRef.current,
      childChunkSize: childChunkSizeRef.current,
      childChunkOverlap: childChunkOverlapRef.current,
    });
    if (response.ok) {
      setChunks(response.data);
      setIsPreviewingChunks(false);
    }
    setIsPreviewingChunks(false);
  };

  const getDocumentIndexProgress = async () => {
    autoRefreshIndexProgressTimer.current = setInterval(async () => {
      const filesPath = currentUploadedFilesRef.current.map(
        (item) => item.filePath,
      );
      const response = await appHelper.apiPost(
        "/wiki/index-document/progress",
        {
          wikiId: currentWikiIdRef.current,
          fileNames: filesPath,
        },
      );
      if (!response.ok) {
        return;
      }
      setDocumentIndexProgress(response.data);
    }, 2000);
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

  const renderIndexStatus = (indexStatus) => {
    switch (indexStatus) {
      case DocumentIndexStatus.Processing:
        return (
          <Badge
            variant={"light"}
            color={theme.colors.blue[5]}
            leftSection={<Loader size={"10"} />}
          >
            {DocumentIndexStatus.text[indexStatus]}
          </Badge>
        );
      case DocumentIndexStatus.Success:
        return (
          <Badge
            variant={"light"}
            color={theme.colors.green[5]}
            leftSection={<CircleCheck size={"12"} />}
          >
            {DocumentIndexStatus.text[indexStatus]}
          </Badge>
        );
      case DocumentIndexStatus.Failed:
        return (
          <Badge
            variant={"light"}
            color={theme.colors.red[5]}
            leftSection={<CircleX size={"10"} />}
          >
            {DocumentIndexStatus.text[indexStatus]}
          </Badge>
        );
    }
  };

  const onIndexDocuments = async () => {
    const filesInfo = currentUploadedFilesRef.current.map((item) => {
      return {
        fileSize: item.fileSize,
        filePath: item.filePath,
      };
    });
    const response = await appHelper.apiPost("/wiki/index-document", {
      filesInfo: filesInfo,
      wikiId: currentWikiIdRef.current,
      chunkType: currentWikiChunkTypeRef.current,
      parentChunkSize: parentChunkSizeRef.current,
      parentChunkOverlap: parentChunkOverlapRef.current,
      childChunkSize: childChunkSizeRef.current,
      childChunkOverlap: childChunkOverlapRef.current,
    });
    if (!response.ok) {
      notify({
        type: "error",
        message: response.message,
      });
      return false;
    }
    return true;
  };

  // endregion

  return (
    <Stack p={"lg"} flex={1} gap={"xs"}>
      <Group justify={"space-between"} mb={"xs"}>
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
                        onClick={onPreviewChunks}
                        leftSection={<Eye size={16} />}
                      >
                        预览
                      </Button>
                    </Group>
                  </Group>
                  <Accordion
                    defaultValue={
                      WikiChunkType.text[currentWikiChunkTypeRef.current]
                    }
                    variant="separated"
                    onChange={(value) => {
                      switch (value) {
                        case WikiChunkType.text[WikiChunkType.Classical]:
                          currentWikiChunkTypeRef.current =
                            WikiChunkType.Classical;
                          break;
                        case WikiChunkType.text[WikiChunkType.ParentChild]:
                          currentWikiChunkTypeRef.current =
                            WikiChunkType.ParentChild;
                          break;
                      }
                    }}
                  >
                    <Accordion.Item
                      value={WikiChunkType.text[WikiChunkType.Classical]}
                    >
                      <Accordion.Control
                        value={WikiChunkType.text[WikiChunkType.Classical]}
                        disabled={
                          currentWikiChunkTypeRef.current !==
                          WikiChunkType.Classical
                        }
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
                            onChange={(value) => {
                              parentChunkSizeRef.current = value;
                            }}
                            description={"分段预估长度(字符)"}
                          />
                          <NumberInput
                            defaultValue={50}
                            description={"分段重叠长度(字符)"}
                            onChange={(value) => {
                              parentChunkOverlapRef.current = value;
                            }}
                          />
                        </Group>
                      </Accordion.Panel>
                    </Accordion.Item>
                    <Accordion.Item
                      value={WikiChunkType.text[WikiChunkType.ParentChild]}
                    >
                      <Accordion.Control
                        value={WikiChunkType.text[WikiChunkType.ParentChild]}
                        disabled={
                          currentWikiChunkTypeRef.current !==
                          WikiChunkType.ParentChild
                        }
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
                            onChange={(value) => {
                              childChunkSizeRef.current = value;
                            }}
                            description={"子分段预估长度(字符)"}
                          />
                          <NumberInput
                            defaultValue={50}
                            onChange={(value) => {
                              childChunkOverlapRef.current = value;
                            }}
                            description={"子分段重叠长度(字符)"}
                          />
                        </Group>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                </Card>
                <Group gap={"xs"} grow align={"flex-start"}>
                  <Card shadow="xs" mb={"md"}>
                    <Group mb={"md"} justify={"space-between"}>
                      <Group gap={"xs"}>
                        <ChartScatter
                          w={16}
                          h={16}
                          color={theme.colors.green[6]}
                        ></ChartScatter>
                        <Text size={"sm"} fw={"bold"}>
                          向量化模型
                        </Text>
                      </Group>
                      <Button
                        size={"xs"}
                        variant={"transparent"}
                        leftSection={<ExternalLink size={16} />}
                      >
                        前往知识库配置
                      </Button>
                    </Group>
                    <Select
                      description={"Embedding模型"}
                      disabled={true}
                      placeholder={"请选择Embedding模型"}
                      defaultValue={defaultEmbeddingModelRef.current.id}
                      data={embeddingModels.map((model) => {
                        return {
                          value: model.id,
                          label: model.name,
                          icon: model?.provider.logo,
                        };
                      })}
                    />
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
                      disabled={true}
                      description={"Rerank模型"}
                      placeholder={"请选择Rerank模型"}
                      defaultValue={defaultRerankModelRef.current.id}
                      data={rerankModels.map((model) => {
                        return {
                          value: model.id,
                          label: model.name,
                          icon: model?.provider.logo,
                        };
                      })}
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
                <Button
                  onClick={async () => {
                    if (!(await onIndexDocuments())) {
                      return;
                    }
                    nextStep();
                    getDocumentIndexProgress();
                  }}
                >
                  保存并处理
                </Button>
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
                  {appHelper.getLength(chunks)}个预览块
                </Chip>
              </Group>
              <Loading visible={isPreviewingChunks} size={"sm"}>
                {appHelper.getLength(chunks) === 0 && <Stack h={"400"}></Stack>}
                <WikiChunkPreview
                  chunks={chunks}
                  chunkType={currentWikiChunkTypeRef.current}
                  theme={theme}
                />
              </Loading>
            </ScrollArea>
          </Card>
        </Group>
      )}
      {currentStep === 3 && (
        <Card withBorder w={"50%"} mt={"xl"}>
          <Group mb={"xs"}>
            <Loader type="bars" size={"sm"} />
            <Title order={4} mb={"4"}>
              正在为您构建可搜索的知识点
            </Title>
          </Group>
          <Text size={"xs"} c={"dimmed"} mb={"xs"}>
            文件内容越丰富，处理时间可能越长, 完成后您可以在知识库中搜索到内容
          </Text>
          <ScrollArea>
            <Stack gap={"xs"} mb={"xl"}>
              {appHelper.getLength(documentIndexProgress) > 0 &&
                documentIndexProgress.map((item) => {
                  return (
                    <Card>
                      <Group mb={"xs"} justify={"space-between"}>
                        <Group>
                          <Image src={"/markdown.png"} w={30} h={30} />
                          <Stack gap={0}>
                            <Text size={"sm"} fw={"bold"}>
                              {item.file_name}
                            </Text>
                            <Group gap={"1"}>
                              <Text size={"xs"} c={"dimmed"}>
                                {item.processed_chunks}
                              </Text>
                              <Text size={"xs"} c={"dimmed"}>
                                /
                              </Text>
                              <Text size={"xs"} c={"dimmed"}>
                                {item.total_chunks} chunks
                              </Text>
                            </Group>
                          </Stack>
                        </Group>
                        {renderIndexStatus(item.status)}
                      </Group>
                      <Progress
                        value={
                          (item.processed_chunks / item.total_chunks) * 100
                        }
                        color={
                          item.status === DocumentIndexStatus.Success
                            ? theme.colors.green[6]
                            : item.status === DocumentIndexStatus.Failed
                              ? theme.colors.red[6]
                              : theme.colors.blue[6]
                        }
                        size="md"
                        animated={!item.status === DocumentIndexStatus.Success}
                      />
                    </Card>
                  );
                })}
            </Stack>
          </ScrollArea>
          <Group>
            <Button
              leftSection={<Album size={"18"} />}
              size={"xs"}
              onClick={() => {
                nav(`/wiki/detail/${currentWikiIdRef.current}/docs`);
              }}
            >
              前往知识库
            </Button>
          </Group>
        </Card>
      )}
    </Stack>
  );
};

export { WikiDocumentCreate };
