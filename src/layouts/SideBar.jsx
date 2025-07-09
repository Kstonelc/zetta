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
  Button,
} from "@mantine/core";
import {
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  FolderCog,
  FilePlus2,
} from "lucide-react";
import WikiIcon from "@/assets/wiki.svg";

const SideBar = () => {
  const theme = useMantineTheme();
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => setCollapsed((c) => !c);

  const menuItems = [
    { icon: <FileText size={16} />, label: "文档" },
    { icon: <FolderCog size={16} />, label: "设置" },
  ];

  return (
    <Flex
      w={collapsed ? rem(60) : rem(200)}
      p='sm'
      style={{
        borderRight: `1px solid ${theme.colors.gray[3]}`,
        transition: "width 0.2s ease",
        minHeight: "calc(100vh - 66px)",
      }}
    >
      <Stack w={"100%"} justify={"space-between"}>
        <Flex direction={"column"} gap={"xs"}>
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
                position='right'
                active={true}
                withArrow
              >
                <NavLink leftSection={item.icon} />
              </Tooltip>
            ) : (
              <NavLink
                key={item.label}
                leftSection={item.icon}
                label={item.label}
                active={true}
                bdrs={8}
                onClick={() => console.log(`点击 ${item.label}`)}
              />
            )
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

export { SideBar };
