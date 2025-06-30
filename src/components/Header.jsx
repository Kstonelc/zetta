import {
  Flex,
  Button,
  Image,
  Menu,
  Avatar,
  useMantineTheme,
} from "@mantine/core";
import zettaLogo from "@/assets/zetta-logo.svg";
import { useLocation, Link } from "react-router-dom";
import { BookOpenText } from "lucide-react";
import classes from "./Header.module.scss";
import React from "react";

const Header = () => {
  const theme = useMantineTheme();

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
            AI
          </Button>
        </Link>
      </Flex>
      <Avatar color={theme.colors.blue[8]} radius="xl">
        KS
      </Avatar>
    </Flex>
  );
};

export { Header };
