import React, { useState } from "react";
import {
  Text,
  Grid,
  Stack,
  Button,
  Group,
  Title,
  Flex,
  Select,
  TextInput,
  Textarea,
  useMantineTheme,
} from "@mantine/core";
import { WikiHomeCard } from "./WikiHomeCard.jsx";
import { Modal, Loading } from "@/components";
import { Grid2x2Plus, Blocks } from "lucide-react";
import classes from "./WikiHome.module.scss";
import { useDisclosure } from "@mantine/hooks";

const WikiHome = () => {
  const theme = useMantineTheme();
  const [
    isWikiAddModalOpen,
    { open: openWikiAddModal, close: closeWikiAddModal },
  ] = useDisclosure(false);

  const cards = [1, 2, 3];
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
            onChange={(e) => {
              console.log(111, e.target.value);
            }}
          />
          <Textarea
            label={"描述"}
            description={"简单介绍一下知识库"}
            placeholder={"请输入知识库描述"}
          />
          <Group justify={"flex-end"}>
            <Button>确认</Button>
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
