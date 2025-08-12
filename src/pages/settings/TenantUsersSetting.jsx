import {
  ActionIcon,
  Avatar,
  Button,
  Group,
  Stack,
  Text,
  Table,
  Badge,
  Select,
  TextInput,
  useMantineTheme,
  Menu,
  Divider,
  TagsInput,
} from "@mantine/core";
import {
  SquarePen,
  UserRoundPlus,
  ChevronsUpDown,
  UserRoundCheck,
  Trash2,
} from "lucide-react";
import { Modal } from "@/components";
import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { UserRole, UserStatus } from "@/enum.js";
import appHelper from "@/AppHelper.js";
import { useUserStore } from "@/stores/useUserStore.js";
import { useNotify } from "@/utils/notify.js";

const TenantUsersSetting = ({ tenant }) => {
  const theme = useMantineTheme();
  const { t } = useTranslation();
  const { notify } = useNotify();
  const { userStore, setUserStore } = useUserStore();
  const [tenantInfo, setTenantInfo] = useState(tenant);
  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false);
  const [isEditTenantModalVisible, setIsEditTenantModalVisible] =
    useState(false);

  const addUserForm = useForm({
    mode: "uncontrolled",
    initialValues: {
      userEmails: [],
      userRole: "",
    },

    validate: {
      userEmails: (values) => {
        if (!appHelper.isArray(values) || values.length === 0) {
          return "请输入邮箱";
        }
        const isValid = values.every((email) => /^\S+@\S+$/.test(email));
        return isValid ? null : "无效邮箱";
      },
      userRole: (value) => {
        return value.trim() ? null : "角色不能为空";
      },
    },
  });

  const editTenantForm = useForm({
    mode: "uncontrolled",
    initialValues: {
      tenantName: tenantInfo.name,
    },

    validate: {},
  });

  useEffect(() => {
    initialize();
    return () => {
      destroy();
    };
  }, [tenant]);

  const initialize = async () => {
    console.log(111, userStore.role);
    setTenantInfo(tenant);
    editTenantForm.setValues({ tenantName: tenant.name });
  };

  const destroy = async () => {};

  //region 方法
  const renderTenantUsersColumns = () => {
    return (
      <Table.Thead>
        <Table.Tr>
          <Table.Th miw={150}>姓名</Table.Th>
          <Table.Th>邮箱</Table.Th>
          <Table.Th miw={80}>状态</Table.Th>
          <Table.Th>角色</Table.Th>
        </Table.Tr>
      </Table.Thead>
    );
  };

  const renderUserStatus = (status) => {
    switch (status) {
      case UserStatus.Active:
        return (
          <Badge variant={"light"} color={theme.colors.green[6]}>
            {UserStatus.text[status]}
          </Badge>
        );
      case UserStatus.Banned:
        return (
          <Badge variant={"light"} color={theme.colors.red[6]}>
            {UserStatus.text[status]}
          </Badge>
        );
      case UserStatus.Pending:
        return (
          <Badge variant={"light"} color={theme.colors.yellow[6]}>
            {UserStatus.text[status]}
          </Badge>
        );
    }
  };

  const renderTenantUsers = () => {
    return (
      <Table.Tbody>
        {tenantInfo.users &&
          tenantInfo.users.map((user) => (
            <Table.Tr key={user.name}>
              <Table.Td>
                <Group gap={"xs"}>
                  <Text size={"sm"}>{user.name}</Text>
                  {userStore.id === user.id && (
                    <Badge variant={"light"}>你</Badge>
                  )}
                </Group>
              </Table.Td>
              <Table.Td>{user.email}</Table.Td>
              <Table.Td>{renderUserStatus(user.status)}</Table.Td>
              <Table.Td>
                <Menu
                  radius={"md"}
                  width={200}
                  disabled={
                    !(userStore.role === UserRole.Owner) ||
                    userStore.id === user.id
                  }
                >
                  <Menu.Target>
                    <Button
                      rightSection={<ChevronsUpDown size={16} />}
                      color={theme.colors.gray[8]}
                      variant={"subtle"}
                    >
                      {UserRole.text[user.role]}
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown p={4}>
                    {UserRole.getOptions().map((option) => (
                      <Menu.Item key={option} onClick={() => {}}>
                        <Stack gap={"0"}>
                          <Group justify={"space-between"}>
                            <Text size={"sm"} fw={"bold"}>
                              {option.label}
                            </Text>
                            {user.role === option.value && (
                              <UserRoundCheck
                                size={20}
                                color={theme.colors.blue[8]}
                              />
                            )}
                          </Group>
                          <Text size={"xs"} c={"dimmed"}>
                            {option.desc}
                          </Text>
                        </Stack>
                      </Menu.Item>
                    ))}
                    {/*<Menu.Item>*/}
                    {/*  <Group justify={"space-between"}>*/}
                    {/*    <Stack gap={"0"}>*/}
                    {/*      <Text size={"sm"} fw={"bold"}>*/}
                    {/*        管理员*/}
                    {/*      </Text>*/}
                    {/*      <Text size={"xs"} c={"dimmed"}>*/}
                    {/*        拥有最高权限*/}
                    {/*      </Text>*/}
                    {/*    </Stack>*/}
                    {/*    <UserRoundCheck*/}
                    {/*      size={20}*/}
                    {/*      color={theme.colors.blue[8]}*/}
                    {/*    />*/}
                    {/*  </Group>*/}
                    {/*</Menu.Item>*/}
                    {/*<Menu.Item>*/}
                    {/*  <Stack gap={"0"}>*/}
                    {/*    <Text size={"sm"} fw={"bold"}>*/}
                    {/*      编辑*/}
                    {/*    </Text>*/}
                    {/*    <Text size={"xs"} c={"dimmed"}>*/}
                    {/*      可以编辑创建应用程序*/}
                    {/*    </Text>*/}
                    {/*  </Stack>*/}
                    {/*</Menu.Item>*/}
                    {/*<Menu.Item>*/}
                    {/*  <Stack gap={"0"}>*/}
                    {/*    <Text size={"sm"} fw={"bold"}>*/}
                    {/*      查看*/}
                    {/*    </Text>*/}
                    {/*    <Text size={"xs"} c={"dimmed"}>*/}
                    {/*      仅使用*/}
                    {/*    </Text>*/}
                    {/*  </Stack>*/}
                    {/*</Menu.Item>*/}
                    <Divider my={2} />
                    <Menu.Item>
                      <Group justify={"space-between"}>
                        <Stack gap={"0"}>
                          <Text size={"sm"} fw={"bold"} c={theme.colors.red[8]}>
                            禁用
                          </Text>
                          <Text size={"xs"} c={"dimmed"}>
                            回收所有权限
                          </Text>
                        </Stack>
                        <Trash2 size={20} color={theme.colors.red[8]} />
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

  const onUpdateTenant = async (values) => {
    const tenantName = values.tenantName;
    const tenantId = tenant.id;
    const response = await appHelper.apiPost("tenant/update-tenant", {
      tenantId: tenantId,
      tenantName: tenantName,
    });
    if (!response.ok) {
      notify({
        type: "error",
        message: response.message,
      });
      return;
    }
    setTenantInfo(response.data);
    setIsEditTenantModalVisible(false);
  };

  const onInviteUsers = async (values) => {
    const response = await appHelper.apiPost("/user/invite-user", {
      userEmail: values.userEmails,
      fromUserId: userStore.id,
      userRole: values.userRole,
      tenantId: tenantInfo.id,
    });
    if (!response.ok) {
      notify({
        type: "error",
        message: response.message,
      });
      return;
    }
    notify({
      type: "success",
      message: response.message,
    });
    setIsAddUserModalVisible(false);
  };

  const isOwner = () => {
    return (
      appHelper.getLength(tenantInfo) &&
      tenantInfo.users.some(
        (user) => user.id === userStore.id && user.role === UserRole.Owner,
      )
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
            {tenantInfo.name?.slice(0, 2).toUpperCase()}
          </Avatar>
          <Stack gap={0}>
            <Group gap={"xs"}>
              <Text
                fw={"bold"}
                size={"sm"}
                maw={300}
                style={{
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {tenantInfo.name}的工作空间
              </Text>
              {isOwner() && (
                <ActionIcon
                  variant={"subtle"}
                  color={theme.colors.gray[7]}
                  onClick={() => {
                    setIsEditTenantModalVisible(true);
                  }}
                >
                  <SquarePen size={16} color={theme.colors.gray[7]} />
                </ActionIcon>
              )}
            </Group>
            <Text size={"xs"} c={"dimmed"}>
              {appHelper.getLength(tenant.users)}个成员
            </Text>
          </Stack>
        </Group>
        {isOwner() && (
          <Button
            leftSection={<UserRoundPlus size={18} />}
            size={"xs"}
            onClick={() => {
              setIsAddUserModalVisible(true);
            }}
          >
            邀请
          </Button>
        )}
      </Group>
      <Table stickyHeader stickyHeaderOffset={60}>
        {renderTenantUsersColumns()}
        {renderTenantUsers()}
      </Table>

      <Modal
        opened={isAddUserModalVisible}
        onClose={() => {
          setIsAddUserModalVisible(false);
        }}
        keepMounted={false}
        title={<Text fw={"bold"}>邀请新成员</Text>}
      >
        <form
          onSubmit={addUserForm.onSubmit((values) => onInviteUsers(values))}
        >
          <Stack gap={"xs"}>
            <TagsInput
              label="邮箱"
              key={addUserForm.key("userEmails")}
              withAsterisk
              placeholder="请填写邮箱地址"
              description={"一次可填写多个邮箱"}
              {...addUserForm.getInputProps("userEmails")}
            />
            <Select
              withAsterisk
              label="角色"
              placeholder="请选择角色"
              key={addUserForm.key("userRole")}
              data={UserRole.getOptions()}
              {...addUserForm.getInputProps("userRole")}
            />
            <Group grow mt={"xs"}>
              <Button
                variant={"subtle"}
                onClick={() => {
                  setIsAddUserModalVisible(false);
                }}
              >
                取消
              </Button>
              <Button type="submit">确认</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={isEditTenantModalVisible}
        onClose={() => {
          setIsEditTenantModalVisible(false);
        }}
        keepMounted={false}
        title={<Text fw={"bold"}>编辑</Text>}
      >
        <form
          onSubmit={editTenantForm.onSubmit((values) => onUpdateTenant(values))}
        >
          <Stack>
            <TextInput
              label={"工作空间"}
              withAsterisk
              key={editTenantForm.key("tenantName")}
              placeholder={"请填写工作空间名称"}
              {...editTenantForm.getInputProps("tenantName")}
            ></TextInput>
            <Group grow mt={"xs"}>
              <Button
                variant={"subtle"}
                onClick={() => {
                  setIsEditTenantModalVisible(false);
                }}
              >
                取消
              </Button>
              <Button type={"submit"}>确认</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
};

export { TenantUsersSetting };
