import appHelper from "@/AppHelper.js";
import { Card, Group, Stack, Text, Code } from "@mantine/core";
import { FileBox } from "lucide-react";
import classes from "@/pages/wiki/wikiCreate/WikiCreate.module.scss";
import { WikiChunkType } from "@/enum.ts";
import React from "react";

const WikiChunkPreview = ({ chunks, chunkType, theme }) => {
  const renderChunkPreview = (chunkType) => {
    switch (chunkType) {
      case WikiChunkType.Classical:
        return (
          <Stack>
            {appHelper.getLength(chunks) > 0 &&
              chunks.slice(0, 10).map((chunk, index) => {
                return (
                  <Card key={index} shadow={"xs"}>
                    <Group gap={"sm"} mb={"xs"}>
                      <FileBox
                        style={{
                          width: 15,
                          height: 15,
                          color: theme.colors.gray[5],
                        }}
                      />
                      <Text size={"xs"} c={"dimmed"} fw={"bold"}>
                        Chunk-{index + 1}
                      </Text>
                    </Group>
                    <Text className={classes.chunkContent} size={"xs"}>
                      {chunk?.page_content}
                    </Text>
                  </Card>
                );
              })}
          </Stack>
        );
      case WikiChunkType.ParentChild:
        return (
          <Stack>
            {appHelper.getLength(chunks) > 0 &&
              chunks.slice(0, 20).map((chunk, index) => {
                return (
                  <Card key={index} shadow={"xs"}>
                    <Group gap={"sm"} mb={"xs"}>
                      <FileBox
                        style={{
                          width: 15,
                          height: 15,
                          color: theme.colors.gray[5],
                        }}
                      />
                      <Text size={"xs"} c={"dimmed"} fw={"bold"}>
                        {chunk?.parent_id}
                      </Text>
                    </Group>
                    <Text
                      className={classes.chunkContent}
                      size={"xs"}
                      mb={"xs"}
                    >
                      {chunk?.content}
                    </Text>
                    {appHelper.getLength(chunk?.children) > 0 &&
                      chunk?.children.map((child) => {
                        return (
                          <Code
                            color={theme.colors.gray[2]}
                            c={theme.black}
                            mb={"xs"}
                          >
                            {child.content}
                          </Code>
                        );
                      })}
                  </Card>
                );
              })}
          </Stack>
        );
    }
  };
  return renderChunkPreview(chunkType);
};

export default WikiChunkPreview;
