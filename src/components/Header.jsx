import {
  Flex,
  Button,
  Image,
  Menu,
  Avatar,
  useMantineTheme,
} from "@mantine/core";
import { IconBook, IconBrain } from "@tabler/icons-react";
import zettaLogo from "@/assets/zetta-logo.svg";
import classes from "./Header.module.scss";
import React from "react";

const Header = () => {
  const theme = useMantineTheme();
  return (
    <Flex
      className={classes.header}
      direction="row"
      justify={"space-between"}
      align={"center"}
    >
      <Image src={zettaLogo} className={classes.logo} />
      <Flex gap={"md"}>
        <Menu shadow="md">
          <Menu.Target>
            <Button variant="light" onClick={() => {}}>
              <IconBook size={20} className={classes.icon} />
              知识库
            </Button>
          </Menu.Target>
          <Menu.Target>
            <Button
              variant="subtle"
              color={theme.colors.gray[6]}
              onClick={() => {}}
            >
              <IconBrain size={20} className={classes.icon} />
              AI
            </Button>
          </Menu.Target>
        </Menu>
      </Flex>
      <Avatar color={theme.colors.blue[8]} radius="xl">
        KS
      </Avatar>
    </Flex>
  );
};

export { Header };
