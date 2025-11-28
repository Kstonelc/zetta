import React from "react";
import {
  Stack,
  Title,
  Text,
  Textarea,
  Group,
  Center,
  Card,
} from "@mantine/core";

const WikiRecallTest = () => {
  return (
    <Stack>
      <Stack gap={"4"}>
        <Title order={4}>命中测试</Title>
        <Text size={"xs"} c={"dimmed"}>
          您可以给指定查询内容,测试知识库的命中效果
        </Text>
      </Stack>
      <Group>
        <Stack flex={1}>
          <Textarea
            label={"查询内容"}
            placeholder={"请输入查询文本，建议使用陈述句"}
            minRows={10}
            maxRows={12}
          />
          <Text size={"sm"} fw={"bold"}>
            查询历史
          </Text>
          <Card>
            <Center>
              <Text size={"sm"} c={"dimmed"}>
                最近无查询结果
              </Text>
            </Center>
          </Card>
        </Stack>
        <Stack flex={1}></Stack>
      </Group>
    </Stack>
  );
};

export { WikiRecallTest };
