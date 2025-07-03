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
  useMantineColorScheme,
} from "@mantine/core";
import zettaLogo from "@/assets/zetta-logo.svg";
import { Modal } from "@/components";
import { useLocation, Link } from "react-router-dom";
import { BookOpenText, Bot, SettingsIcon } from "lucide-react";
import classes from "./Header.module.scss";
import React from "react";
import { useDisclosure } from "@mantine/hooks";

const Header = () => {
  const theme = useMantineTheme();
  const [
    isUserSettingOpen,
    { open: openUserSetting, close: closeUserSetting },
  ] = useDisclosure(false);
  const { toggleColorScheme } = useMantineColorScheme();

  const currentRoute = useLocation();

  //  TODO 可以用 router 文件中抽取路由不写死
  const isActive = (route) => {
    return route === currentRoute.pathname;
  };

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
        </Menu.Dropdown>
      </Menu>
      <Modal
        fullScreen={true}
        opened={isUserSettingOpen}
        onClose={closeUserSetting}
        title={
          <Text fw={"bold"} size={"xl"}>
            用户设置
          </Text>
        }
      ></Modal>
      {/*<Button*/}
      {/*  onClick={() => {*/}
      {/*    toggleColorScheme();*/}
      {/*  }}*/}
      {/*>*/}
      {/*  切换*/}
      {/*</Button>*/}
    </Flex>
  );
};

export { Header };
