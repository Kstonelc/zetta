import {
  Flex,
  Button,
  Image,
  Menu,
  Avatar,
  useMantineTheme,
} from "@mantine/core";
import zettaLogo from "@/assets/zetta-logo.svg";
import { BookOpenText } from "lucide-react";
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
              <BookOpenText className={classes.icon} size={20} />
              知识库
            </Button>
          </Menu.Target>
          <Menu.Target>
            <Button
              variant="subtle"
              color={theme.colors.gray[6]}
              onClick={() => {}}
            >
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
