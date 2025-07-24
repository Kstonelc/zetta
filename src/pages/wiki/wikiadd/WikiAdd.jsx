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
import { ArrowLeft, FileText, LayoutPanelTop } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WikiDataType } from "@/enum";
import classes from "./WikiAdd.module.scss";

const WikiAdd = () => {
  const theme = useMantineTheme();
  const nav = useNavigate();
  const [active, setActive] = useState(1);
  const [wikiDataType, setWikiDataType] = useState(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.1);
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

  const initialize = async () => {};

  const destroy = async () => {};

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
          <Stepper.Step label="知识库配置"></Stepper.Step>
          <Stepper.Step label="数据处理"></Stepper.Step>
          <Stepper.Step label="完成"></Stepper.Step>
        </Stepper>
      </Group>
      <ScrollArea>
        <Text size={"lg"} fw={"bold"} mb={"md"}>
          知识库配置
        </Text>
        <Stack w={"600"}>
          <TextInput label={"名称"} placeholder={"请输入知识库名称"} />
          <Textarea
            label={"描述"}
            description={"简单介绍一下知识库"}
            placeholder={"请输入知识库描述"}
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
                setWikiDataType(WikiDataType.Structured);
              }}
              flex={1}
              bg={
                wikiDataType === WikiDataType.Structured
                  ? theme.colors.blue[0]
                  : "transparent"
              }
              style={{
                border:
                  wikiDataType === WikiDataType.Structured &&
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
                  checked={wikiDataType === WikiDataType.Structured}
                />
              </Group>
              <Text c={"dimmed"} size={"xs"}>
                标准结构化数据
              </Text>
            </Card>
            <Card
              onClick={() => {
                setWikiDataType(WikiDataType.Unstructured);
              }}
              bg={
                wikiDataType === WikiDataType.Unstructured
                  ? theme.colors.blue[0]
                  : "transparent"
              }
              flex={1}
              style={{
                border:
                  wikiDataType === WikiDataType.Unstructured &&
                  `1px solid ${theme.colors.blue[3]}`,
              }}
            >
              <Group mb={"md"} justify={"space-between"}>
                <Group gap={"xs"}>
                  <FileText size={30} color={theme.colors.violet[8]}></FileText>
                  <Text size={"sm"}>非结构化数据</Text>
                </Group>
                <Radio
                  size={"xs"}
                  checked={wikiDataType === WikiDataType.Unstructured}
                />
              </Group>
              <Text c={"dimmed"} size={"xs"}>
                txt, doc, pdf等非结构化数据
              </Text>
            </Card>
          </Group>
          <Select label={"Embedding模型"} placeholder={"请选择Embedding模型"} />
          <Select label={"Rank模型"} placeholder={"请选择Rank模型"} />
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
      <Divider />
      <Group>
        <Button>下一步</Button>
        <Button variant={"light"} color={theme.colors.gray[7]}>
          取消
        </Button>
      </Group>
    </Stack>
  );
};

export { WikiAdd };
