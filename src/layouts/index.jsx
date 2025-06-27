import { Divider, Stack } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { Header } from "@/components";
import classes from "@/pages/Wiki.module.scss";
import React from "react";

const Layouts = () => {
  return (
    <Stack>
      <Header />
      <Divider size="xs" className={classes.divider} />
      <Outlet />
    </Stack>
  );
};

export default Layouts;
