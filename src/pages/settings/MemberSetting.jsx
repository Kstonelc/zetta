import {
  ActionIcon,
  Avatar,
  Button,
  Group,
  Stack,
  Text,
  Table,
  Badge,
  useMantineTheme,
  Menu,
  Divider,
} from "@mantine/core";
import {
  SquarePen,
  UserRoundPlus,
  ChevronsUpDown,
  UserRoundCheck,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import React, { useState } from "react";

const MemberSetting = () => {
  const theme = useMantineTheme();
  const { t } = useTranslation();
  const [members, setMembers] = useState([
    {
      name: "admin",
      email: "2609753201@qq.com",
      updated_at: "",
      role: "管理员",
    },
  ]);

  //region 方法
  const renderMembersColumns = () => {
    return (
      <Table.Thead>
        <Table.Tr>
          <Table.Th>姓名</Table.Th>
          <Table.Th>邮箱</Table.Th>
          <Table.Th>上次更新时间</Table.Th>
          <Table.Th>角色</Table.Th>
        </Table.Tr>
      </Table.Thead>
    );
  };
  const renderMembers = () => {
    return (
      <Table.Tbody>
        {members.map((element) => (
          <Table.Tr key={element.name}>
            <Table.Td>
              <Group gap={"xs"}>
                <Text size={"sm"}>{element.name}</Text>
                <Badge variant={"light"} size={"sm"}>
                  {t("title")}
                </Badge>
              </Group>
            </Table.Td>
            <Table.Td>{element.email}</Table.Td>
            <Table.Td>{element.updated_at}</Table.Td>
            <Table.Td>
              <Menu radius={"md"} width={200}>
                <Menu.Target>
                  <Button
                    rightSection={<ChevronsUpDown size={16} />}
                    color={theme.colors.gray[8]}
                    variant={"subtle"}
                  >
                    {element.role}
                  </Button>
                </Menu.Target>
                <Menu.Dropdown p={4}>
                  <Menu.Item>
                    <Group justify={"space-between"}>
                      <Stack gap={"0"}>
                        <Text size={"sm"} fw={"bold"}>
                          管理员
                        </Text>
                        <Text size={"xs"} c={"dimmed"}>
                          拥有最高权限
                        </Text>
                      </Stack>
                      <UserRoundCheck size={20} color={theme.colors.blue[8]} />
                    </Group>
                  </Menu.Item>
                  <Menu.Item>
                    <Stack gap={"0"}>
                      <Text size={"sm"} fw={"bold"}>
                        编辑
                      </Text>
                      <Text size={"xs"} c={"dimmed"}>
                        可以编辑创建应用程序
                      </Text>
                    </Stack>
                  </Menu.Item>
                  <Menu.Item>
                    <Stack gap={"0"}>
                      <Text size={"sm"} fw={"bold"}>
                        查看
                      </Text>
                      <Text size={"xs"} c={"dimmed"}>
                        仅使用
                      </Text>
                    </Stack>
                  </Menu.Item>
                  <Divider />
                  <Menu.Item>
                    <Group>
                      <Trash2 size={20} color={theme.colors.red[8]} />
                      <Stack gap={"0"}>
                        <Text size={"sm"} fw={"bold"} c={theme.colors.red[8]}>
                          禁用
                        </Text>
                        <Text size={"xs"} c={"dimmed"}>
                          回收所有权限
                        </Text>
                      </Stack>
                    </Group>
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    );
  };

  //endregion

  return (
    <Stack>
      <Text size={"xl"} fw={"bold"}>
        成员
      </Text>
      <Group
        justify={"space-between"}
        bg={theme.colors.gray[1]}
        p={"sm"}
        bdrs={"md"}
      >
        <Group>
          <Avatar color={theme.colors.blue[8]} radius="xl">
            KS
          </Avatar>
          <Stack gap={0}>
            <Group gap={"xs"}>
              <Text fw={"bold"} size={"sm"}>
                Zetta的工作空间
              </Text>
              <ActionIcon variant={"subtle"} color={theme.colors.gray[7]}>
                <SquarePen size={16} color={theme.colors.gray[7]} />
              </ActionIcon>
            </Group>
            <Text size={"xs"} c={"dimmed"}>
              1 个成员
            </Text>
          </Stack>
        </Group>
        <Button leftSection={<UserRoundPlus size={18} />} size={"xs"}>
          添加
        </Button>
      </Group>
      <Table stickyHeader stickyHeaderOffset={60}>
        {renderMembersColumns()}
        {renderMembers()}
      </Table>
    </Stack>
  );
};

export { MemberSetting };
