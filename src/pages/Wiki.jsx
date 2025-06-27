import React from "react";
import { AppShell, Text, Container, Box, Stack, Divider } from "@mantine/core";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import classes from "./Wiki.module.scss";

const Wiki = () => {
  return (
    <Stack className={classes.container}>
      <SimpleEditor></SimpleEditor>
    </Stack>
  );
};

export { Wiki };
