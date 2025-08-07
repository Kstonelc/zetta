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
  Radio,
  Select,
  Textarea,
  NumberInput,
  Slider,
  useMantineTheme,
} from "@mantine/core";
import React, { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { ArrowLeft, FileText, LayoutPanelTop } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModelType, WikiType } from "@/enum";
import classes from "./WikiCreate.module.scss";
import { WikiCreateCancelModal } from "@/pages/wiki/wikiCreate/modal/WikiCreateCancelModal.jsx";
import appHelper from "@/AppHelper.js";
import { useNotify } from "@/utils/notify.js";
import { useUserStore } from "@/stores/useUserStore.js";

const WikiCreate = () => {
  const theme = useMantineTheme();
  const nav = useNavigate();
  const { userStore, setUserStore } = useUserStore();
  const { notify } = useNotify();
  const wikiCreateForm = useForm();

  const [embeddingModels, setEmbeddingModels] = useState([]);
  const [rerankModels, setRerankModels] = useState([]);
  const [active, setActive] = useState(1);
  const [wikiType, setWikiType] = useState(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextStep = () =>
    setActive((current) => (current < 3 ? current + 1 : current));
  const prevStep = () =>
    setActive((current) => (current > 0 ? current - 1 : current));

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

  //endregion

  return (
    <Stack p={"lg"}>
      <Group>
        <Button
          leftSection={<ArrowLeft size={16} />}
          variant={"subtle"}
          size={"md"}
          onClick={() => {
            nav(-1);
          }}
        >
          返回
        </Button>
        <Stepper
          active={active}
          onStepClick={setActive}
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
      <form onSubmit={wikiCreateForm.onSubmit(onCreateBlankWiki)}>
        <ScrollArea>
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
              nav(-1);
            }}
          >
            取消
          </Button>
          <Button>下一步</Button>
        </Group>
      </form>
      <WikiCreateCancelModal
        opened={false}
        onClose={() => {}}
      ></WikiCreateCancelModal>
    </Stack>
  );
};

export { WikiCreate };
