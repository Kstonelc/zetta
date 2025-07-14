import React, { useState } from "react";
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
  Group,
  Button,
} from "@mantine/core";
import {
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  FolderCog,
  FilePlus2,
  ChevronLeft,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import WikiIcon from "@/assets/wiki.svg";

const WikiSideBar = ({ wikiId }) => {
  const theme = useMantineTheme();
  const currentRoute = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => setCollapsed((c) => !c);

  const menuItems = [
    {
      icon: <FileText size={16} />,
      label: "文档",
      path: `/wiki/${wikiId}/docs`,
    },
    { icon: <FolderCog size={16} />, label: "设置", path: "/wiki/detail/edit" },
  ];

  //region 方法
  const isActive = (route) => {
    return route === currentRoute.pathname;
  };
  //endregion

  return (
    <Flex
      w={collapsed ? rem(60) : rem(200)}
      p="sm"
      h={"100%"}
      style={{
        borderRight: `1px solid ${theme.colors.gray[3]}`,
        transition: "width 0.2s ease",
      }}
    >
      <Stack w={"100%"} justify={"space-between"}>
        <Flex direction={"column"} gap={"xs"} align={collapsed && "center"}>
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
            <Text fw={"bold"} size={"sm"} mb={12}>
              Relink数据库
            </Text>
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
                  leftSection={item.icon}
                  to={item.path}
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
                label={item.label}
                to={item.path}
                active={isActive(item.path)}
                bdrs={"md"}
              />
            ),
          )}
        </Flex>
        <ActionIcon variant={"subtle"} onClick={toggle} bdrs={8}>
          {collapsed ? (
            <PanelLeftOpen color={theme.colors.gray[7]} />
          ) : (
            <PanelLeftClose color={theme.colors.gray[7]} />
          )}
        </ActionIcon>
      </Stack>
    </Flex>
  );
};

export { WikiSideBar };
