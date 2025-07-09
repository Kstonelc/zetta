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
import { ChatBox } from "@/components";

import classes from "./Agent.module.scss";

const Agent = () => {
  const theme = useMantineTheme();

  return (
    <Stack className={classes.container}>
      {/* <Group align='flex-start'>
        <Paper shadow='xs' radius='md' p={"sm"} w={200} withBorder>
          <Text fw={"bold"} size={"sm"} mb={8}>
            摘要
          </Text>
          <Divider mb={8} />
          <Text size={"sm"}>暂无内容</Text>
        </Paper>
        <WikiDetailEdit />
      </Group> */}
      <ChatBox></ChatBox>
    </Stack>
  );
};

export { Agent };
