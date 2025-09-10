import {
  Stack,
  Text,
  Stepper,
  ScrollArea,
  Group,
  Button,
  TextInput,
  Card,
  Divider,
  Image,
  Radio,
  Select,
  Textarea,
  NumberInput,
  ActionIcon,
  Slider,
  Modal,
  useMantineTheme,
} from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import React, { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import {
  ArrowLeft,
  FileText,
  LayoutPanelTop,
  Trash2,
  CircleAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModelType, WikiType } from "@/enum";
import classes from "./WikiCreate.module.scss";
import appHelper from "@/AppHelper.js";
import Notion from "@/assets/wiki/notion.svg";
import LocalFile from "@/assets/wiki/local-file.png";
import MarkDown from "@/assets/markdown.png";
import Chrome from "@/assets/chrome.png";
import InBox from "@/assets/inbox.svg";
import { useNotify } from "@/utils/notify.js";
import { useUserStore } from "@/stores/useUserStore.js";

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
  const [wikiType, setWikiType] = useState(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);

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

  const uploadFile = async (files) => {
    const response = await appHelper.apiPost("/wiki/upload-file", {
      files: files,
    });
    console.log(111, response);
  };

  //endregion

  return (
    <Stack p={"lg"}>
      <Group>
        <Button
          leftSection={<ArrowLeft size={16} />}
          variant={"subtle"}
          size={"md"}
          onClick={() => {
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
          <Text size={"sm"} c={"dimmed"} mb={"md"}>
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
          <Stepper.Step label="数据处理" />
          <Stepper.Step label="完成" />
        </Stepper>
      </Group>
      {currentStep === 1 && (
        <form onSubmit={wikiCreateForm.onSubmit(onCreateBlankWiki)}>
          <ScrollArea h={"75vh"}>
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
                    setWikiType(WikiType.Structured);
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
                      <LayoutPanelTop size={30} color={theme.colors.blue[8]} />
                      <Text size={"sm"}>结构化数据</Text>
                    </Group>
                    <Radio
                      size={"xs"}
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
                      <FileText
                        size={30}
                        color={theme.colors.violet[8]}
                      ></FileText>
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
          <Divider my={"sm"} />
          <Group>
            <Button variant={"subtle"} type={"submit"} disabled={isSubmitting}>
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
        </form>
      )}
      {currentStep === 2 && (
        <>
          <ScrollArea h={"75vh"}>
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
              {/*<Card withBorder py={"xs"}>*/}
              {/*  <Group gap={"xs"}>*/}
              {/*    <Image src={Notion} w={25} h={25} />*/}
              {/*    <Text size={"sm"}>同步Notion</Text>*/}
              {/*  </Group>*/}
              {/*</Card>*/}
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
                await uploadFile(files);
              }}
              onReject={(files) => console.log("rejected files", files)}
              maxSize={5 * 1024 ** 2}
              maxFiles={10}
              accept={{
                "text/markdown": [".md", ".markdown"],
                "text/plain": [".md", ".markdown"],
              }}
              mb={"sm"}
              w={"35%"}
            >
              <Group justify="center" gap="xl" mih={150}>
                <Image src={InBox} w={50} h={50} />
                <div>
                  <Text size="xl" inline mb={"sm"}>
                    拖拽或点击文件上传
                  </Text>
                  <Text size={"sm"} c={"dimmed"}>
                    每个文件不超过5M, 支持md, markdown等格式
                  </Text>
                </div>
              </Group>
            </Dropzone>
            <Card w={"35%"} withBorder p={"sm"}>
              <Group justify={"space-between"}>
                <Group gap={"sm"}>
                  <Image src={MarkDown} w={25} h={20} />
                  <div>
                    <Text size={"xs"} fw={"bold"}>
                      Gin.md
                    </Text>
                    <Text size={"xs"} c={"dimmed"}>
                      MarkDown 0.6M
                    </Text>
                  </div>
                </Group>
                <ActionIcon
                  variant={"subtle"}
                  size={"sm"}
                  color={theme.colors.gray[6]}
                >
                  <Trash2 size={16} />
                </ActionIcon>
              </Group>
            </Card>
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
    </Stack>
  );
};

export { WikiCreate };
