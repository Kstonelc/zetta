import React from "react";
import {
  AppShell,
  Text,
  Container,
  ActionIcon,
  Box,
  Grid,
  Card,
  Stack,
  Button,
  Group,
  Badge,
  Image,
  Title,
  Divider,
  ScrollArea,
  Flex,
  Menu,
  Center,
  useMantineTheme,
} from "@mantine/core";
import { WikiHomeCard } from "./WikiHomeCard.jsx";
import { Select, Modal, Loading, TextInput, TextArea } from "@/components";
import { Grid2x2Plus, Blocks } from "lucide-react";
import classes from "./WikiHome.module.scss";

const WikiHome = () => {
  const theme = useMantineTheme();

  const cards = [1, 2, 3];
  return (
    <Stack className={classes.container}>
      <Title order={3}>知识库</Title>
      <Flex gap={"sm"} justify={"space-between"}>
        <Select
          data={["软件研发", "产品设计"]}
          value={"软件研发"}
          searchable={true}
          placeholder={"请选择部门"}
        />
        <Modal
          title={
            <Group gap={"sm"}>
              <Blocks size={20} color={theme.colors.blue[8]} />
              <Text fw={"bold"} size={"lg"}>
                创建知识库
              </Text>
            </Group>
          }
          trigger={
            <Button leftSection={<Grid2x2Plus size={16} />}>新建知识库</Button>
          }
        >
          <TextInput
            label={"名称"}
            required={true}
            placeholder={"请输入知识库名称"}
            onChange={(e) => {
              console.log(111, e.target.value);
            }}
          />
          <TextArea
            label={"描述"}
            description={"简单介绍一下知识库"}
            placeholder={"请输入知识库描述"}
          />
          <Group justify={"flex-end"}>
            <Button>确认</Button>
          </Group>
        </Modal>
      </Flex>
      <Loading>
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
