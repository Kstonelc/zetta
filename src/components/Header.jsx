import { Flex, Button, Image, Menu } from "@mantine/core";
import { IconBook, IconBrain } from "@tabler/icons-react";
import zettaLogo from "@/assets/zetta-logo.svg";
import classes from "./Header.module.scss";
import React from "react";

const Header = () => {
  return (
    <Flex
      className={classes.header}
      direction="row"
      justify={"space-between"}
      align={"center"}
    >
      <Image src={zettaLogo} className={classes.logo} />
      <Flex gap={"md"}>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button variant="light">
              <IconBook size={20} className={classes.icon} />
              知识库
            </Button>
          </Menu.Target>
          <Menu.Target>
            <Button variant="subtle" color={"grey"}>
              <IconBrain size={20} className={classes.icon} />
              AI
            </Button>
          </Menu.Target>
        </Menu>
      </Flex>
      <Button>333</Button>
    </Flex>
  );
};

export { Header };
