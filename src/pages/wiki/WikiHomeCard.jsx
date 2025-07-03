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
import WikiIcon from "@/assets/wiki.svg";
import { Ellipsis, Tags, SquarePen, Trash, Star } from "lucide-react";
import React from "react";

const WikiHomeCard = () => {
  const theme = useMantineTheme();
  return (
    <Card
      shadow="md"
      padding="lg"
      radius={"md"}
      // onClick={() =>
      //   notifications.show({
      //     withCloseButton: false,
      //     message: "点击了知识库",
      //     color: theme.colors.green[6],
      //     autoClose: 3000,
      //   })
      // }
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
            <Image src={WikiIcon} w={18} h={18} />
          </Center>
          <Flex direction={"column"}>
            <Text fw={"bold"}>知识库</Text>
            <Text size={"xs"} c="dimmed">
              3文档 | 1600字符 | 关联1应用
            </Text>
          </Flex>
        </Group>
        <Group>
          <ActionIcon variant="transparent">
            <Star size={16} color={theme.colors.yellow[9]} />
          </ActionIcon>
          <Menu>
            <Menu.Target>
              <ActionIcon variant="transparent" color={theme.colors.dark[2]}>
                <Ellipsis size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<SquarePen size={15} />}>
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
          Relink产品描述
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
