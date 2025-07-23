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
} from "@mantine/core";
import zettaLogo from "@/assets/zetta-logo.svg";
import { Modal } from "@/components";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { BookOpenText, Bot, SettingsIcon, LogOut } from "lucide-react";
import { UserSettings } from "@/pages";
import classes from "./Header.module.scss";
import React from "react";
import { useDisclosure } from "@mantine/hooks";
import appHelper from "@/AppHelper";

const Header = () => {
  const theme = useMantineTheme();
  const nav = useNavigate();

  const [
    isUserSettingOpen,
    { open: openUserSetting, close: closeUserSetting },
  ] = useDisclosure(false);

  const currentRoute = useLocation();

  const isActive = (route) => {
    return currentRoute.pathname.startsWith(route);
  };

  //region 方法

  const onPressLogOut = async () => {
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
      <Image src={zettaLogo} className={classes.logo} />
      <Flex gap={"md"}>
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
            <Bot className={classes.icon} size={20} />
            AI
          </Button>
        </Link>
      </Flex>
      <Menu shadow="md" width={250} radius={"md"}>
        <Menu.Target>
          <Avatar color={theme.colors.blue[8]} radius="xl">
            KS
          </Avatar>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item>
            <Group justify={"space-between"}>
              <Flex direction={"column"}>
                <Text fw={"bold"}>liuchang</Text>
                <Box w={"160"}>
                  <Text size={"sm"} c={"dimmed"} truncate="end">
                    liuchang@yrobot.com
                  </Text>
                </Box>
              </Flex>
              <Avatar color={theme.colors.blue[8]} radius="xl">
                KS
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
            <Text size={"sm"} c={"dimmed"}>
              设置
            </Text>
          </Menu.Item>
          <Menu.Item
            onClick={onPressLogOut}
            leftSection={<LogOut size={16} color={theme.colors.gray[6]} />}
          >
            <Text size={"sm"} c={"dimmed"}>
              登出
            </Text>
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
