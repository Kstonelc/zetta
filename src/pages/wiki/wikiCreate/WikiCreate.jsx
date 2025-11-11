import {
  ActionIcon,
  Button,
  Card,
  Divider,
  Group,
  Image,
  Center,
  Modal,
  NumberInput,
  Radio,
  ScrollArea,
  Select,
  Slider,
  Stack,
  Stepper,
  Text,
  Textarea,
  TextInput,
  Chip,
  Accordion,
  useMantineTheme,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { Loading } from "@/components";
import React, { useEffect, useState, useRef } from "react";
import { useForm } from "@mantine/form";
import {
  ArrowLeft,
  CircleAlert,
  FileText,
  LayoutPanelTop,
  Trash2,
  FileBox,
  TextQuote,
  Eye,
  Cog,
  ScanEye,
  ChartScatter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WikiChunkType, FileType, ModelType, WikiType } from "@/enum.js";
import classes from "./WikiCreate.module.scss";
import appHelper from "@/AppHelper.js";
import LocalFile from "/assets/wiki/local-file.png";
import MarkDown from "/markdown.png";
import Pdf from "/pdf.png";
import Chrome from "/chrome.png";
import InBox from "/inbox.svg";
import { useNotify } from "@/utils/notify.js";
import { useUserStore } from "@/stores/useUserStore.js";
import WikiChunkPreview from "./WikiChunkPreview";

const WikiCreate = () => {
  const theme = useMantineTheme();
  const nav = useNavigate();
  const { userStore, setUserStore } = useUserStore();
  const { notify } = useNotify();
  const wikiCreateForm = useForm({
    initialValues: {
      wikiName: "",
      wikiDesc: "",
      wikiSimThresh: 0.1,
      embeddingModel: "",
      rerankModel: "",
    },
    onValuesChange: (changedValues) => {
      if (changedValues.wikiEmbeddingId !== undefined) {
        defaultEmbeddingModelRef.current = changedValues.wikiEmbeddingId;
      }
    },
    validate: {
      wikiName: (value) => (value.trim() ? null : "名称不能为空"),
      wikiDesc: (value) => (value.trim() ? null : "描述不能为空"),
      wikiEmbeddingId: (value) => (value ? null : "请选择Embedding模型"),
      wikiRerankId: (value) => (value ? null : "请选择Rerank模型"),
    },
  });

  const [embeddingModels, setEmbeddingModels] = useState([]);
  const [rerankModels, setRerankModels] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [wikiType, setWikiType] = useState(WikiType.Unstructured);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [chunks, setChunks] = useState([]);
  const [isPreviewingChunks, setIsPreviewingChunks] = useState(false);
  const [wikiChunkType, setWikiChunkType] = useState(WikiChunkType.Classical);

  const currentWikiChunkTypeRef = useRef(WikiChunkType.Classical);
  const parentChunkSizeRef = useRef(1000);
  const parentChunkOverlapRef = useRef(100);
  const childChunkSizeRef = useRef(200);
  const childChunkOverlapRef = useRef(50);
  const defaultEmbeddingModelRef = useRef("");

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
    await getEmbeddingModels();
    await getRerankModels();
  };

  const destroy = async () => {};

  //endregion

  //region 方法

  const onCreateBlankWiki = async (values) => {
    const userId = userStore.id;
    const tenantId = userStore.current_tenant.id;
    values.wikiType = wikiType;
    values.wikiSimThresh = similarityThreshold;
    values.userId = userId;
    values.tenantId = tenantId;
    if (!wikiType) {
      notify({
        type: "error",
        message: "请选择知识库类型",
      });
      return;
    }
    if (!values.wikiSimThresh) {
      notify({
        type: "error",
        message: "请选择相似度阈值",
      });
      return;
    }
    setIsSubmitting(true);
    const response = await appHelper.apiPost("/wiki/create-wiki", values);
    if (!response.ok) {
      notify({
        type: "error",
        message: response.message,
      });
      setIsSubmitting(false);
      return;
    }
    notify({
      type: "success",
      message: response.message,
    });
    setIsSubmitting(false);
    nav(-1);
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
      return [...prevMap.values(), ...results];
    });
    setIsUploading(false);
  };

  const onDeleteFile = (fileName) => {
    setUploadedFiles((prev) => {
      return prev.filter((item) => item.fileName !== fileName);
    });
  };

  const onPreviewChunks = async () => {
    setIsPreviewingChunks(true);
    const response = await appHelper.apiPost("/wiki/preview-file-chunks", {
      filePath: uploadedFiles[0].filePath,
      chunkType: WikiChunkType.ParentChild,
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

  //endregion

  //region 组件渲染

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
        if (fileSize > 100) {
          fileSize = (fileSize / 1000).toFixed(2) + "M";
        } else {
          fileSize = fileSize + "K";
        }
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

  //endregion

  return (
    <Stack p={"lg"} flex={1}>
      <Group>
        <Button
          leftSection={<ArrowLeft size={16} />}
          variant={"subtle"}
          size={"md"}
          onClick={() => {
            setIsPreviewingChunks(false);
            setIsExitModalVisible(true);
          }}
        >
          返回
        </Button>
        <Modal
          opened={isExitModalVisible}
          onClose={() => {
            setIsExitModalVisible(false);
          }}
          title={
            <Group gap={"sm"} align={"center"}>
              <CircleAlert size={20} color={theme.colors.yellow[6]} />
              <Text size={"md"} fw={"bold"}>
                温馨提示
              </Text>
            </Group>
          }
        >
          <Text size={"sm"} c={"dimmed"} mb={"xl"}>
            临时数据将不会被保存，确定退出吗?
          </Text>
          <Group grow>
            <Button
              variant={"subtle"}
              onClick={() => {
                setIsExitModalVisible(false);
              }}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                setIsExitModalVisible(false);
                nav(-1);
              }}
            >
              确定
            </Button>
          </Group>
        </Modal>
        <Stepper
          active={currentStep}
          allowNextStepsSelect={false}
          size={"xs"}
          className={classes.absoluteCenter}
          miw={500}
        >
          <Stepper.Step label="知识库配置" />
          <Stepper.Step label="数据上传" />
          <Stepper.Step label="数据处理" />
        </Stepper>
      </Group>
      {currentStep === 1 && (
        <form
          onSubmit={wikiCreateForm.onSubmit(onCreateBlankWiki)}
          className={classes.step1Form}
        >
          <ScrollArea h={"calc(100vh - 250px)"}>
            <Text size={"lg"} fw={"bold"} mb={"md"}>
              知识库配置
            </Text>
            <Stack w={"600"}>
              <TextInput
                label={"名称"}
                key={wikiCreateForm.key("wikiName")}
                placeholder={"请输入知识库名称"}
                withAsterisk
                {...wikiCreateForm.getInputProps("wikiName")}
              />
              <Textarea
                label={"描述"}
                key={wikiCreateForm.key("wikiDesc")}
                description={"简单介绍一下知识库"}
                placeholder={"请输入知识库描述"}
                {...wikiCreateForm.getInputProps("wikiDesc")}
              />
              <Group gap={2}>
                <Text size={"sm"} fw={"bold"}>
                  数据类型
                </Text>
                <Text c={theme.colors.red[8]}>*</Text>
              </Group>
              <Group>
                <Card
                  onClick={() => {
                    // setWikiType(WikiType.Structured);
                  }}
                  flex={1}
                  bg={
                    wikiType === WikiType.Structured
                      ? theme.colors.blue[0]
                      : "transparent"
                  }
                  style={{
                    border:
                      wikiType === WikiType.Structured &&
                      `1px solid ${theme.colors.blue[3]}`,
                  }}
                >
                  <Group justify={"space-between"} mb={"md"}>
                    <Group gap={"xs"}>
                      <Center
                        bg={theme.colors.blue[5]}
                        w={25}
                        h={25}
                        style={{
                          borderRadius: theme.radius.sm,
                        }}
                      >
                        <LayoutPanelTop size={16} color={theme.white} />
                      </Center>
                      <Text size={"sm"}>结构化数据(Coming soon )</Text>
                    </Group>
                    <Radio
                      size={"xs"}
                      disabled={true}
                      checked={wikiType === WikiType.Structured}
                    />
                  </Group>
                  <Text c={"dimmed"} size={"xs"}>
                    标准结构化数据
                  </Text>
                </Card>
                <Card
                  onClick={() => {
                    setWikiType(WikiType.Unstructured);
                  }}
                  bg={
                    wikiType === WikiType.Unstructured
                      ? theme.colors.blue[0]
                      : "transparent"
                  }
                  flex={1}
                  style={{
                    border:
                      wikiType === WikiType.Unstructured &&
                      `1px solid ${theme.colors.blue[3]}`,
                  }}
                >
                  <Group mb={"md"} justify={"space-between"}>
                    <Group gap={"xs"}>
                      <Center
                        bg={theme.colors.violet[5]}
                        w={25}
                        h={25}
                        style={{
                          borderRadius: theme.radius.sm,
                        }}
                      >
                        <FileText size={16} color={theme.white} />
                      </Center>
                      <Text size={"sm"}>非结构化数据</Text>
                    </Group>
                    <Radio
                      size={"xs"}
                      checked={wikiType === WikiType.Unstructured}
                    />
                  </Group>
                  <Text c={"dimmed"} size={"xs"}>
                    txt, doc, pdf等非结构化数据
                  </Text>
                </Card>
              </Group>
              <Select
                label={"Embedding模型"}
                description={"用于将文本转换为向量"}
                key={wikiCreateForm.key("wikiEmbeddingId")}
                placeholder={"请选择Embedding模型"}
                data={embeddingModels.map((model) => {
                  return {
                    value: model.id,
                    label: model.name,
                  };
                })}
                withAsterisk
                {...wikiCreateForm.getInputProps("wikiEmbeddingId")}
              />
              <Select
                label={"Rerank模型"}
                description={"用于将向量进行排序"}
                key={wikiCreateForm.key("wikiRerankId")}
                placeholder={"请选择Rerank模型"}
                data={rerankModels.map((model) => {
                  return {
                    value: model.id,
                    label: model.name,
                  };
                })}
                withAsterisk
                {...wikiCreateForm.getInputProps("wikiRerankId")}
              />
              <Stack>
                <Text fw={"bold"} size={"sm"}>
                  相似度阈值
                </Text>
                <Group>
                  <Slider
                    flex={1}
                    mx={"xs"}
                    mb={"md"}
                    min={0.1}
                    max={1.0}
                    value={similarityThreshold}
                    onChange={(value) => {
                      setSimilarityThreshold(value);
                    }}
                    step={0.05}
                    defaultValue={0.1}
                    size="sm"
                    marks={[
                      { value: 0.1, label: "最小" },
                      { value: 1.0, label: "最大" },
                    ]}
                  />
                  <NumberInput
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    w={"100"}
                    value={similarityThreshold}
                    onChange={(value) => {
                      setSimilarityThreshold(value);
                    }}
                  />
                </Group>
              </Stack>
            </Stack>
          </ScrollArea>

          <Stack>
            <Divider />
            <Group>
              <Button
                variant={"subtle"}
                type={"submit"}
                disabled={isSubmitting}
              >
                创建空的知识库
              </Button>
              <Button
                variant={"light"}
                color={theme.colors.gray[7]}
                onClick={() => {
                  setIsExitModalVisible(true);
                }}
              >
                取消
              </Button>
              <Button
                onClick={() => {
                  nextStep();
                }}
              >
                下一步
              </Button>
            </Group>
          </Stack>
        </form>
      )}
      {currentStep === 2 && (
        <>
          <ScrollArea h={"calc(100vh - 250px)"}>
            <Text size={"sm"} mb={"md"} fw={"bold"}>
              选择数据源
            </Text>
            <Group mb={"xl"}>
              <Card withBorder py={"xs"}>
                <Group gap={"xs"}>
                  <Image src={LocalFile} w={25} h={25} />
                  <Text size={"sm"}>上传本地文件</Text>
                </Group>
              </Card>
              <Card withBorder py={"xs"}>
                <Group gap={"xs"}>
                  <Image src={Chrome} w={25} h={25} />
                  <Text size={"sm"}>同步Web站点</Text>
                </Group>
              </Card>
            </Group>
            <Text size={"sm"} mb={"md"} fw={"bold"}>
              上传文件
            </Text>
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
              maxFiles={10}
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
            {renderUploadedFiles()}
          </ScrollArea>
          <Divider my={"sm"} />
          <Group>
            <Button
              variant={"light"}
              color={theme.colors.gray[7]}
              onClick={() => {
                prevStep();
              }}
            >
              上一步
            </Button>
            <Button
              onClick={() => {
                nextStep();
              }}
            >
              下一步
            </Button>
          </Group>
        </>
      )}
      {currentStep === 3 && (
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
                    defaultValue={WikiChunkType.text[WikiChunkType.Classical]}
                    variant="separated"
                    onChange={(value) => {
                      switch (value) {
                        case WikiChunkType.text[WikiChunkType.Classical]:
                          currentWikiChunkTypeRef.current =
                            WikiChunkType.Classical;
                          setWikiChunkType(WikiChunkType.Classical);
                          break;
                        case WikiChunkType.text[WikiChunkType.ParentChild]:
                          currentWikiChunkTypeRef.current =
                            WikiChunkType.ParentChild;
                          setWikiChunkType(WikiChunkType.ParentChild);
                          break;
                      }
                    }}
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
                          <Select
                            description="切分方式"
                            defaultValue={"按长度切分"}
                            data={["按长度切分"]}
                          />
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
                            onChange={(value) => {
                              parentChunkSizeRef.current = value;
                            }}
                            description={"父分段预估长度(字符)"}
                          />
                          <NumberInput
                            defaultValue={100}
                            onChange={(value) => {
                              parentChunkOverlapRef.current = value;
                            }}
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
                    <Select
                      description={"Embedding模型"}
                      defaultValue={defaultEmbeddingModelRef.current}
                      data={embeddingModels.map((model) => {
                        return {
                          value: model.id,
                          label: model.name,
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
                        向量检索
                      </Text>
                    </Group>
                    <Select description={"Rerank模型"} mb={"sm"} />
                    <Group grow>
                      <NumberInput
                        description={"TopK(提取前几?)"}
                      ></NumberInput>
                      <NumberInput
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
                <Button>保存</Button>
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
                  size={"xs"}
                  defaultValue={uploadedFiles.map((file) => file.fileName)[0]}
                  data={uploadedFiles.map((file) => file.fileName)}
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
                  chunkType={wikiChunkType}
                  theme={theme}
                />
              </Loading>
            </ScrollArea>
          </Card>
        </Group>
      )}
    </Stack>
  );
};

export { WikiCreate };
