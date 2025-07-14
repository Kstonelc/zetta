import { Text, Tabs, Card, Stack, Image, Group } from "@mantine/core";
import { Modal, TextInput } from "@/components";
import { Brain, SquareUser, Search } from "lucide-react";
import QWen from "@/assets/models/qwen.svg";
import React from "react";

const UserSettings = ({ isUserSettingOpen, closeUserSetting }) => {
  return (
    <Modal
      fullScreen={true}
      styles={{
        header: {
          paddingLeft: "30%",
          paddingRight: "30%",
        },
        body: {
          paddingLeft: "30%",
          paddingRight: "30%",
        },
      }}
      opened={isUserSettingOpen}
      onClose={closeUserSetting}
      title={
        <Text fw={"bold"} size={"xl"}>
          设置
        </Text>
      }
    >
      <Tabs
        defaultValue="models"
        orientation="vertical"
        variant="pills"
        radius="md"
      >
        <Tabs.List>
          <Tabs.Tab value="models" leftSection={<Brain size={16} />}>
            模型配置
          </Tabs.Tab>
          <Tabs.Tab value="members" leftSection={<SquareUser size={16} />}>
            成员
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="models" px={"lg"}>
          <Stack gap={"md"}>
            <Group justify={"space-between"}>
              <Text size={"xl"} fw={"bold"}>
                模型供应商
              </Text>
              <TextInput
                leftSection={<Search size={16} />}
                placeholder={"搜索"}
              ></TextInput>
            </Group>
            <Text size={"sm"}>模型列表</Text>
            <ModelCard></ModelCard>
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="members" px={"lg"}>
          Messages tab content
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
};

const ModelCard = ({ model }) => {
  return (
    <Card shadow={"sm"} withBorder radius={"md"}>
      <Group>
        <Image src={QWen} w={30} h={30} />
        <Text size={"sm"}>通义千问</Text>
      </Group>
    </Card>
  );
};
export { UserSettings };
