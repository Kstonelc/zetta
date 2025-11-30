import React, { useState } from "react";
import {
  Stack,
  Title,
  Text,
  Textarea,
  Group,
  Center,
  Badge,
  Card,
  Button,
  Image,
  useMantineTheme,
  Divider,
  ScrollArea,
} from "@mantine/core";
import { FileSearch } from "lucide-react";
import { Loading } from "@/components";
import Target from "/assets/wiki/target.svg";
import appHelper from "@/AppHelper.js";
import { useParams } from "react-router-dom";
import { FileType } from "@/enum.js";

const WikiRecallTest = () => {
  const theme = useMantineTheme();
  const { wikiId } = useParams();

  const [recallRes, setRecallRes] = useState(null);
  const [isRecalling, setIsRecalling] = useState(false);

  // region 方法
  const onRecall = async () => {
    setIsRecalling(true);
    const response = await appHelper.apiPost("wiki/recall-docs", {
      wikiId: wikiId,
      queryContent: "如何安装react-native-smooth-wheel",
    });
    if (!response.ok) {
      setIsRecalling(false);
      return;
    }
    setIsRecalling(false);
    setRecallRes(response.data);
  };
  // endregion

  // region 组件渲染
  const renderFileIcon = (fileExt) => {
    return (
      <Image src={FileType.icon[FileType.getFileType(fileExt)]} w={20} h={20} />
    );
  };
  // endregion

  return (
    <Stack>
      <Stack gap={"4"}>
        <Title order={4}>命中测试</Title>
        <Text size={"xs"} c={"dimmed"}>
          您可以给指定查询内容,测试知识库的命中效果
        </Text>
      </Stack>
      <Group align={"flex-start"}>
        <Stack flex={1}>
          <Textarea
            label={"查询内容"}
            placeholder={"请输入查询文本，建议使用陈述句"}
            minRows={10}
            maxRows={12}
          />
          <Group justify={"flex-end"}>
            <Button
              leftSection={<FileSearch size={16} />}
              onClick={async () => {
                await onRecall();
              }}
            >
              检索
            </Button>
          </Group>
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
        <Stack flex={1} h={"80vh"}>
          <Card bg={theme.colors.gray[0]} flex={1}>
            {appHelper.getLength(recallRes) === 0 && (
              <Center flex={1}>
                <Image src={Target} h={60} w={60} />
              </Center>
            )}
            {appHelper.getLength(recallRes) > 0 && (
              <ScrollArea>
                <Loading visible={isRecalling}>
                  {recallRes.map((item, index) => {
                    const score = item[1].toFixed(3);
                    const content = item[0].page_content;
                    const source = item[0].metadata.source.split("/")[1];
                    return (
                      <Card key={index} mb={"xs"}>
                        <Stack>
                          <Group justify={"flex-end"}>
                            <Badge variant={"light"}>score:{score}</Badge>
                          </Group>
                          <Text size={"xs"} c={"dimmed"}>
                            {content}
                          </Text>
                          <Divider />
                          <Group>
                            {renderFileIcon(appHelper.getFileExt(source))}
                            <Text size={"xs"}>{source}</Text>
                          </Group>
                        </Stack>
                      </Card>
                    );
                  })}
                </Loading>
              </ScrollArea>
            )}
          </Card>
        </Stack>
      </Group>
    </Stack>
  );
};

export { WikiRecallTest };
