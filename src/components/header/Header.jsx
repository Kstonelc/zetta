import {
  Flex,
  Button,
  Image,
  Menu,
  Box,
  Avatar,
  Group,
  Text,
  useMantineTheme,
  Divider,
  Stack,
} from "@mantine/core";
import bichonLogo from "/bichon-logo.svg";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  BookOpenText,
  Bot,
  SettingsIcon,
  Users,
  LogOut,
  ChevronsUpDown,
  MessagesSquare,
} from "lucide-react";
import { UserSettings } from "@/pages";
import classes from "./Header.module.scss";
import React, { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import appHelper from "@/AppHelper";
import { useUserStore } from "@/stores/useUserStore";

const Header = () => {
  const theme = useMantineTheme();
  const nav = useNavigate();

  const [
    isUserSettingOpen,
    { open: openUserSetting, close: closeUserSetting },
  ] = useDisclosure(false);
  const { userStore, setUserStore } = useUserStore();

  const currentRoute = useLocation();

  const [currentTenant, setCurrentTenant] = useState(null);
  const [allTenants, setAllTenants] = useState([]);

  // region 初始化

  useEffect(() => {
    initialize();
    return () => {
      destroy();
    };
  }, [userStore]);

  const initialize = async () => {
    setCurrentTenant(userStore?.current_tenant);
    setAllTenants(userStore?.tenants);
  };

  const destroy = async () => {};

  //endregion

  //region 方法

  const isActive = (route) => {
    return currentRoute.pathname.startsWith(route);
  };

  const onClickLogOut = async () => {
    appHelper.setAccessToken(null);
    nav({
      pathname: "/user/login",
    });
  };
  //endregion

  return (
    <Flex
      className={classes.header}
      direction="row"
      justify={"space-between"}
      align={"center"}
    >
      <Group>
        <Image src={bichonLogo} className={classes.logo} />
        {currentTenant && (
          <Menu shadow="md" width={200} radius={"md"}>
            <Menu.Target>
              <Button
                variant={"light"}
                color={theme.colors.gray[6]}
                leftSection={
                  <Avatar color={theme.colors.blue[8]} radius="xl" size={"sm"}>
                    {userStore && userStore.name.slice(0, 2).toUpperCase()}
                  </Avatar>
                }
                rightSection={<ChevronsUpDown size={16} />}
              >
                <Stack gap={0} align={"flex-start"}>
                  <Text size={"xs"} fw={"bold"} c={theme.colors.gray[7]}>
                    {currentTenant.name}的工作空间
                  </Text>
                </Stack>
              </Button>
            </Menu.Target>

            <Menu.Dropdown p={"xs"}>
              <Text size={"xs"} mb={"xs"}>
                工作空间
              </Text>
              {appHelper.getLength(allTenants) > 0 &&
                allTenants.map((tenant) => {
                  return (
                    <Menu.Item
                      disabled={tenant.id === currentTenant.id}
                      leftSection={
                        <Users size={16} color={theme.colors.blue[6]} />
                      }
                    >
                      <Text size={"sm"} c={theme.colors.gray[8]}>
                        {tenant.name}
                      </Text>
                    </Menu.Item>
                  );
                })}
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
      <Group
        pos="absolute"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <Link to="/app">
          <Button
            variant={isActive("/app") ? "light" : "subtle"}
            color={!isActive("/app") && theme.colors.gray[6]}
          >
            <Bot className={classes.icon} size={20} />
            工作室
          </Button>
        </Link>
        <Link to="/wiki">
          <Button
            variant={isActive("/wiki") ? "light" : "subtle"}
            color={!isActive("/wiki") && theme.colors.gray[6]}
          >
            <BookOpenText className={classes.icon} size={20} />
            知识库
          </Button>
        </Link>
        <Link to="/agent">
          <Button
            variant={isActive("/agent") ? "light" : "subtle"}
            color={!isActive("/agent") && theme.colors.gray[6]}
          >
            <MessagesSquare className={classes.icon} size={20} />
            AI
          </Button>
        </Link>
      </Group>
      <Menu shadow="md" width={250} radius={"md"}>
        <Menu.Target>
          <Avatar color={theme.colors.blue[8]} radius="xl">
            {userStore && userStore.name.slice(0, 2).toUpperCase()}
          </Avatar>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item>
            <Group justify={"space-between"}>
              <Flex direction={"column"}>
                <Text fw={"bold"} maw={120}>
                  {userStore && userStore.name}
                </Text>
                <Box w={"160"}>
                  <Text size={"sm"} c={"dimmed"} truncate="end">
                    {userStore && userStore.email}
                  </Text>
                </Box>
              </Flex>
              <Avatar color={theme.colors.blue[8]} radius="xl">
                {userStore && userStore.name.slice(0, 2).toUpperCase()}
              </Avatar>
            </Group>
          </Menu.Item>
          <Divider my={4} />
          <Menu.Item
            onClick={openUserSetting}
            leftSection={
              <SettingsIcon size={16} color={theme.colors.gray[6]} />
            }
          >
            <Text size={"sm"}>设置</Text>
          </Menu.Item>
          <Menu.Item
            onClick={onClickLogOut}
            leftSection={<LogOut size={16} color={theme.colors.gray[6]} />}
          >
            <Text size={"sm"}>登出</Text>
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <UserSettings
        closeUserSetting={closeUserSetting}
        isUserSettingOpen={isUserSettingOpen}
      />
    </Flex>
  );
};

export { Header };
