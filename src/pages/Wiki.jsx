import React from "react";
import {
  AppShell,
  Text,
  Container,
  ActionIcon,
  Box,
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
  useMantineTheme,
} from "@mantine/core";
import { ArrowRight } from "lucide-react";
import classes from "./Wiki.module.scss";

const Wiki = () => {
  const theme = useMantineTheme();
  return (
    <Stack className={classes.container}>
      <Title order={2}>知识库</Title>
      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        style={{
          width: 300,
        }}
      >
        <Flex direction={"row"} justify={"flex-start"} mb={"md"} gap="md">
          <Image
            src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-8.png"
            radius={"md"}
            style={{
              width: 50,
              height: 50,
            }}
            alt="Norway"
          />
          <Text fw={500}>我的第一个知识库</Text>
        </Flex>

        <Text size="sm" c="dimmed">
          知识库简介
        </Text>
        <Flex direction={"row"} justify={"space-between"} align={"baseline"}>
          <Badge color="pink">标签</Badge>
          <ActionIcon radius={"xl"} p={4}>
            <ArrowRight />
          </ActionIcon>
        </Flex>
      </Card>
    </Stack>
  );
};

export { Wiki };
