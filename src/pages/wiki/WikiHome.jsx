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
import { Select, Modal, Loading } from "@/components";
import { Grid2x2Plus } from "lucide-react";
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
          title={<Text fw={"bold"}>新建知识库</Text>}
          trigger={
            <Button leftSection={<Grid2x2Plus size={16} />}>新建知识库</Button>
          }
        ></Modal>
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
