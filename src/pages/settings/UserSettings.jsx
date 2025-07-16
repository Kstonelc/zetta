import {
  Text,
  Tabs,
  Card,
  Stack,
  Image,
  Group,
  Badge,
  Flex,
  useMantineTheme,
  Button,
  ActionIcon,
  Switch,
  TextInput,
} from "@mantine/core";
import { Modal, Drawer } from "@/components";
import {
  Brain,
  SquareUser,
  Search,
  CircleAlert,
  Settings2,
  ArrowUpRight,
} from "lucide-react";
import QWen from "@/assets/models/qwen.svg";
import React, { useState } from "react";

const UserSettings = ({ isUserSettingOpen, closeUserSetting }) => {
  const theme = useMantineTheme();
  const [isModelSettingVisible, setIsModelSettingVisible] = useState(false);

  const onOpenModelSetting = () => {
    setIsModelSettingVisible(true);
  };

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
            <ModelCard onOpenModelSetting={onOpenModelSetting} />
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="members" px={"lg"}>
          Messages tab content
        </Tabs.Panel>
      </Tabs>
      <Drawer
        title={"模型配置"}
        opened={isModelSettingVisible}
        onClose={() => {
          setIsModelSettingVisible(false);
        }}
      >
        <TextInput label={"API_KEY"} description={"配置API_KEY以激活模型"} />
        <Flex justify={"flex-start"} mt={-15} align={"center"} mb={"md"}>
          <Button
            variant={"transparent"}
            size={"compact-xs"}
            leftSection={
              <ArrowUpRight size={16} color={theme.colors.blue[8]} />
            }
            onClick={() =>
              window.open("https://bailian.console.aliyun.com/", "_blank")
            }
          >
            api_key如何获取?
          </Button>
        </Flex>
        <Text fw={"bold"}>模型列表</Text>
        <Card withBorder shadow={"sm"} radius={"md"} p={"sm"}>
          <Stack gap={"sm"}>
            <Group justify={"space-between"}>
              <Group>
                <Image src={QWen} w={30} h={30} />
                <Text size={"sm"}>qwen-plus-0125</Text>
              </Group>
              <Switch defaultChecked />
            </Group>
            <Group justify={"space-between"}>
              <Group>
                <Image src={QWen} w={30} h={30} />
                <Text size={"sm"}>qwen-plus-0125</Text>
              </Group>
              <Switch defaultChecked />
            </Group>
            <Group justify={"space-between"}>
              <Group>
                <Image src={QWen} w={30} h={30} />
                <Text size={"sm"}>qwen-plus-0125</Text>
              </Group>
              <Switch defaultChecked />
            </Group>
            <Group justify={"space-between"}>
              <Group>
                <Image src={QWen} w={30} h={30} />
                <Text size={"sm"}>qwen-plus-0125</Text>
              </Group>
              <Switch defaultChecked />
            </Group>
            <Group justify={"space-between"}>
              <Group>
                <Image src={QWen} w={30} h={30} />
                <Text size={"sm"}>qwen-plus-0125</Text>
              </Group>
              <Switch defaultChecked />
            </Group>
          </Stack>
        </Card>
      </Drawer>
    </Modal>
  );
};

const ModelCard = ({ onOpenModelSetting }) => {
  const theme = useMantineTheme();
  return (
    <Card shadow={"sm"} withBorder radius={"md"}>
      <Group justify={"space-between"}>
        <Flex direction={"column"}>
          <Group mb={"xs"} justify={"space-between"}>
            <Group gap={"sm"} align={"space-between"}>
              <Image src={QWen} w={45} h={45} />
              <Flex direction={"column"} justify={"space-between"}>
                <Text size={"sm"} fw={"bold"}>
                  通义千问
                </Text>
                <Badge
                  size={"xs"}
                  variant={"light"}
                  color={theme.colors.yellow[8]}
                  leftSection={
                    <CircleAlert size={12} color={theme.colors.yellow[8]} />
                  }
                >
                  请配置API KEY
                </Badge>
              </Flex>
            </Group>
          </Group>
          <Group gap={"xs"}>
            <Badge color={theme.colors.gray[5]} size={"xs"}>
              LLM
            </Badge>
            <Badge color={theme.colors.gray[5]} size={"xs"}>
              TEXT EMBEDDING
            </Badge>
            <Badge color={theme.colors.gray[5]} size={"xs"}>
              TEXT GENERATION
            </Badge>
          </Group>
        </Flex>
        <ActionIcon variant={"light"} onClick={onOpenModelSetting}>
          <Settings2 size={16} />
        </ActionIcon>
      </Group>
    </Card>
  );
};

export { UserSettings };
