import React, { useEffect, useRef, useState } from "react";
import {
  Text,
  Grid,
  Stack,
  Button,
  Group,
  Title,
  Flex,
  Select,
  Card,
  Radio,
  ActionIcon,
  TextInput,
  Textarea,
  useMantineTheme,
} from "@mantine/core";
import { WikiHomeCard } from "./WikiHomeCard.jsx";
import { Modal, Loading } from "@/components";
import { Grid2x2Plus, Blocks, LayoutPanelTop, FileText } from "lucide-react";
import classes from "./WikiHome.module.scss";
import { useDisclosure } from "@mantine/hooks";
import { WikiDataType } from "@/enum";
import appHelper from "@/AppHelper.js";
import { useUserStore } from "@/stores/useUserStore.js";

const WikiHome = () => {
  const theme = useMantineTheme();
  const { userStore, setUserStore } = useUserStore();
  const [
    isWikiAddModalOpen,
    { open: openWikiAddModal, close: closeWikiAddModal },
  ] = useDisclosure(false);

  const [wikiName, setWikiName] = useState("");
  const [wikiDataType, setWikiDataType] = useState(null);
  const cards = [1, 2, 3];

  //region 初始化
  useEffect(() => {
    initialize();
    return () => {
      destroy();
    };
  }, []);

  const initialize = async () => {
    console.log("用户信息", userStore);
  };

  const destroy = async () => {};
  //endregion

  //region 方法
  const isCanNext = () => {
    return appHelper.getLength(wikiName) > 0 && wikiDataType !== null;
  };
  //endregion

  return (
    <Stack className={classes.container}>
      <Title order={3}>知识库</Title>
      <Flex gap={"sm"} justify={"space-between"}>
        <Select
          data={["软件研发", "产品设计"]}
          searchable={true}
          placeholder={"请选择部门"}
        />
        <Button
          leftSection={<Grid2x2Plus size={16} />}
          onClick={() => {
            openWikiAddModal();
          }}
        >
          新建知识库
        </Button>
        <Modal
          keepMounted={false}
          opened={isWikiAddModalOpen}
          onClose={closeWikiAddModal}
          title={
            <Group gap={"sm"}>
              <Blocks size={20} color={theme.colors.blue[8]} />
              <Text fw={"bold"} size={"lg"}>
                创建知识库
              </Text>
            </Group>
          }
        >
          <TextInput
            label={"名称"}
            required={true}
            placeholder={"请输入知识库名称"}
            value={wikiName}
            onChange={(e) => {
              setWikiName(e.target.value);
            }}
          />
          <Group gap={2}>
            <Text size={"sm"}>数据类型</Text>
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
                  <LayoutPanelTop size={20} color={theme.colors.blue[8]} />
                  <Text size={"sm"}>结构化数据</Text>
                </Group>
                <Radio
                  size={"xs"}
                  checked={wikiDataType === WikiDataType.Structured}
                />
              </Group>
              <Text c={"dimmed"} size={"xs"}>
                标准数据集
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
                  <FileText size={20} color={theme.colors.violet[8]}></FileText>
                  <Text size={"sm"}>非结构化数据</Text>
                </Group>
                <Radio
                  size={"xs"}
                  checked={wikiDataType === WikiDataType.Unstructured}
                />
              </Group>
              <Text c={"dimmed"} size={"xs"}>
                txt, doc, pdf等文件
              </Text>
            </Card>
          </Group>
          <Textarea
            label={"描述"}
            description={"简单介绍一下知识库"}
            placeholder={"请输入知识库描述"}
          />
          <Group justify={"flex-end"}>
            <Button disabled={!isCanNext()}>确认</Button>
          </Group>
        </Modal>
      </Flex>
      <Loading visible={false}>
        <Grid gutter="md">
          {cards.map((card) => (
            <Grid.Col key={card} span={{ base: 12, sm: 6, md: 3 }}>
              <WikiHomeCard />
            </Grid.Col>
          ))}
        </Grid>
      </Loading>
    </Stack>
  );
};

export { WikiHome };
