import React from "react";
import { AppShell, Text, Container, Box, Stack, Divider } from "@mantine/core";
import { Header } from "../components";
import classes from "./Home.module.scss";

const Home = () => {
  return (
    <Stack>
      <Header />
      <Divider size="xs" className={classes.divider} />
    </Stack>
  );
};

export { Home };
