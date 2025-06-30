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
import { WikiCard } from "@/components";
import WikiIcon from "@/assets/wiki.svg";
import { ArrowRight, Tags, Ellipsis } from "lucide-react";
import classes from "./Wiki.module.scss";

const Wiki = () => {
  const theme = useMantineTheme();
  const cards = [1, 2, 3, 4, 5, 6, 7];
  return (
    <Stack className={classes.container}>
      <Title order={3}>知识库</Title>
      <Grid gutter="md">
        {cards.map((card) => (
          <Grid.Col key={card} span={{ base: 12, sm: 6, md: 3 }}>
            <WikiCard></WikiCard>
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  );
};

export { Wiki };
