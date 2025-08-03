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
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";

const Agent = () => {
  const theme = useMantineTheme();

  return (
    <Stack p={"lg"} flex={1}>
      <Dropzone
        w={400}
        onDrop={(files) => console.log("accepted files", files)}
        onReject={(files) => console.log("rejected files", files)}
        maxSize={5 * 1024 ** 2}
        accept={IMAGE_MIME_TYPE}
      >
        <Group
          justify="center"
          gap="xl"
          mih={220}
          style={{ pointerEvents: "none" }}
        >
          <Text size="xl" inline>
            上传文件
          </Text>
        </Group>
      </Dropzone>
    </Stack>
  );
};

export { Agent };
