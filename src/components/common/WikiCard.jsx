import {
  ActionIcon,
  Badge,
  Card,
  Center,
  Flex,
  Group,
  Image,
  Menu,
  Text,
  useMantineTheme,
} from "@mantine/core";
import WikiIcon from "@/assets/wiki.svg";
import { Ellipsis, Tags } from "lucide-react";
import React from "react";

const WikiCard = () => {
  const theme = useMantineTheme();
  return (
    <Card shadow="sm" padding="lg" radius={"md"}>
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
            <Image src={WikiIcon} w={20} h={20} />
          </Center>
          <Flex direction={"column"}>
            <Text fw={600}>知识库</Text>
            <Text size={"xs"} c="dimmed">
              3文档 | 1600字符 | 关联1应用
            </Text>
          </Flex>
        </Group>
        <Group>
          <Menu position="right-start">
            <Menu.Target>
              <ActionIcon variant="white" color={theme.colors.gray[9]}>
                <Ellipsis size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item>编辑</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
      <Flex mb={"xl"}>
        <Text size={"sm"} color={theme.colors.gray[6]}>
          Relink产品描述
        </Text>
      </Flex>
      <Badge leftSection={<Tags size={15} />} variant={"light"}>
        标签
      </Badge>
      <Menu position="right-start" offset={6}>
        {/* Menu items */}
      </Menu>
    </Card>
  );
};
export { WikiCard };
