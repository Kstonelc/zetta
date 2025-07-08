import { WikiDetailEdit } from "@/pages/index.js";
import {
  Stack,
  Text,
  Group,
  Flex,
  AppShell,
  useMantineTheme,
  Button,
  Paper,
  Divider,
} from "@mantine/core";

import classes from "./Agent.module.scss";

const Agent = () => {
  const theme = useMantineTheme();
  return (
    <Stack className={classes.container}>
      <Group align="flex-start">
        {/*flex 1 不可以下在Editor上*/}
        <Paper shadow="xs" radius="md" p={"sm"} w={200} withBorder>
          <Text fw={"bold"} size={"sm"} mb={8}>
            摘要
          </Text>
          <Divider mb={8} />
          <Text size={"sm"}>暂无内容</Text>
        </Paper>
        <WikiDetailEdit />
      </Group>
    </Stack>
  );
};

export { Agent };
