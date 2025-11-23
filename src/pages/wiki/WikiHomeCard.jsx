import {
  ActionIcon,
  Badge,
  Card,
  Center,
  Divider,
  Flex,
  Group,
  Image,
  Menu,
  Text,
  useMantineTheme,
} from "@mantine/core";
import WikiIcon from "/wiki.svg";
import {
  Ellipsis,
  Tags,
  SquarePen,
  Trash,
  Star,
  SwatchBook,
} from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

const WikiHomeCard = ({ wikiId, name, desc }) => {
  const theme = useMantineTheme();
  const nav = useNavigate();
  return (
    <Card
      padding="lg"
      withBorder
      onClick={() => {
        nav(`/wiki/detail/${wikiId}/docs`);
      }}
    >
      <Group mb={"md"} justify="space-between">
        <Group>
          <Center
            bg={theme.colors.blue[0]}
            w={40}
            h={40}
            style={{
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.colors.blue[1]}`,
            }}
          >
            <SwatchBook
              h={18}
              w={18}
              color={theme.colors.violet[6]}
            ></SwatchBook>
          </Center>
          <Flex direction={"column"}>
            <Text fw={"bold"}>{name}</Text>
            <Text size={"xs"} c="dimmed">
              3文档 | 1600字符 | 关联1应用
            </Text>
          </Flex>
        </Group>
        <Group gap={0}>
          <ActionIcon variant="transparent">
            <Star size={16} color={theme.colors.yellow[9]} />
          </ActionIcon>
          <Menu>
            <Menu.Target>
              <ActionIcon
                variant="transparent"
                color={theme.colors.dark[2]}
                onClick={(e) => {
                  // 阻止事件冒泡
                  e.stopPropagation();
                }}
              >
                <Ellipsis size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<SquarePen size={15} />}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Text size={"xs"}>编辑</Text>
              </Menu.Item>
              <Divider my={4}></Divider>
              <Menu.Item
                leftSection={<Trash size={15} />}
                color={theme.colors.red[9]}
              >
                <Text size={"xs"}>删除</Text>
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
      <Flex mb={"xl"}>
        <Text size={"sm"} color={theme.colors.gray[6]}>
          {desc}
        </Text>
      </Flex>
      <Group justify={"space-between"}>
        <Badge leftSection={<Tags size={15} />} variant={"light"}>
          标签
        </Badge>
      </Group>
    </Card>
  );
};
export { WikiHomeCard };
