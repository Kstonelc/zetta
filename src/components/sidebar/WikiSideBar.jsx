import React, { useEffect, useState } from "react";
import {
  NavLink,
  Tooltip,
  Stack,
  rem,
  Flex,
  useMantineTheme,
  ActionIcon,
  Text,
  Divider,
  Image,
  Center,
  Button,
} from "@mantine/core";
import {
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  FolderCog,
  FilePlus2,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import WikiIcon from "/wiki.svg";
import appHelper from "@/AppHelper.js";
import { useNotify } from "@/utils/notify.js";

const WikiSideBar = ({ wikiId }) => {
  const theme = useMantineTheme();
  const currentRoute = useLocation();
  const { notify } = useNotify();
  const [collapsed, setCollapsed] = useState(false);
  const [wikiInfo, setWikiInfo] = useState(null);

  const toggle = () => setCollapsed((c) => !c);

  const menuItems = [
    {
      icon: <FileText size={16} />,
      label: "文档",
      path: `/wiki/detail/${wikiId}/docs`,
    },
    {
      icon: <FolderCog size={16} />,
      label: "设置",
      path: `/wiki/detail/${wikiId}/settings`,
    },
  ];

  // region 初始化
  useEffect(() => {
    initialize();
    return () => {
      destroy();
    };
  }, []);

  const initialize = async () => {
    await getWikiInfo();
  };

  const destroy = async () => {};

  // endregion

  //region 方法
  const isActive = (route) => {
    return route === currentRoute.pathname;
  };

  const getWikiInfo = async () => {
    const response = await appHelper.apiPost("/wiki/find-wiki", {
      wikiId: wikiId,
    });
    if (!response.ok) {
      notify({
        type: "error",
        message: response.message,
      });
      return;
    }
    setWikiInfo(response.data);
  };

  //endregion

  return (
    <Stack
      w={collapsed ? 70 : 200}
      h={"100%"}
      style={{
        borderRight: `1px solid ${theme.colors.gray[3]}`,
        transition: "width 0.2s ease",
      }}
    >
      <Stack w={"100%"} h={"100%"} justify={"space-between"} p={"sm"}>
        <Stack gap={"xs"} align={collapsed && "center"}>
          <Center
            mb={8}
            bg={theme.colors.blue[0]}
            w={35}
            h={35}
            style={{
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.colors.blue[1]}`,
            }}
          >
            <Image src={WikiIcon} w={18} h={18} />
          </Center>
          {!collapsed && (
            <Stack mb={12} gap={"1"}>
              <Text fw={"bold"}>{wikiInfo?.name}</Text>
              <Text size={"xs"} c={"dimmed"}>
                {wikiInfo?.desc}
              </Text>
            </Stack>
          )}
          {collapsed ? (
            <ActionIcon>
              <FilePlus2 size={16} />
            </ActionIcon>
          ) : (
            <Button leftSection={<FilePlus2 size={16} />}>新建文档</Button>
          )}
          <Divider my={4} />
          {menuItems.map((item) =>
            collapsed ? (
              <Tooltip
                key={item.label}
                label={item.label}
                position="right"
                withArrow
              >
                <NavLink
                  bdrs={"md"}
                  ml={collapsed ? "xs" : null}
                  leftSection={item.icon}
                  to={item.path}
                  label={null}
                  component={Link}
                  active={isActive(item.path)}
                />
              </Tooltip>
            ) : (
              <NavLink
                key={item.label}
                size={"xs"}
                leftSection={item.icon}
                component={Link}
                ml={collapsed ? "xs" : null}
                label={item.label}
                to={item.path}
                active={isActive(item.path)}
                bdrs={"md"}
              />
            ),
          )}
        </Stack>
        <ActionIcon variant={"subtle"} onClick={toggle} bdrs={8}>
          {collapsed ? (
            <PanelLeftOpen color={theme.colors.gray[7]} />
          ) : (
            <PanelLeftClose color={theme.colors.gray[7]} />
          )}
        </ActionIcon>
      </Stack>
    </Stack>
  );
};

export { WikiSideBar };
