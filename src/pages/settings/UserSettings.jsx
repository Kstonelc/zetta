import {
  Text,
  Tabs,
  Card,
  Stack,
  Image,
  Group,
  Badge,
  Flex,
  Button,
  Center,
  useMantineTheme,
  ActionIcon,
  TextInput,
} from "@mantine/core";
import { Modal, Drawer } from "@/components";
import {
  Brain,
  SquareUser,
  Search,
  CircleAlert,
  Settings2,
  Settings,
  Blocks,
  Check,
} from "lucide-react";
import QWen from "@/assets/models/qwen.svg";
import NoData from "@/assets/no-data.png";
import React, { useEffect, useState } from "react";
import appHelper from "@/AppHelper";
import { ModelSetting } from "./ModelSetting";
import { ModelGlobalSetting } from "@/pages/model/ModelGlobalSetting.jsx";

const UserSettings = ({ isUserSettingOpen, closeUserSetting }) => {
  const theme = useMantineTheme();
  const [isModelSettingVisible, setIsModelSettingVisible] = useState(false);
  const [isModalGlobalSettingVisible, setIsModalGlobalSettingVisible] =
    useState(false);
  const [modelProviders, setModelProviders] = useState([]);
  const [currentModelProvider, setCurrentModelProvider] = useState(null);

  const onOpenModelSetting = (provider) => {
    setCurrentModelProvider(provider);
    setIsModelSettingVisible(true);
  };

  const onOpenModelGlobalSetting = () => {
    setIsModalGlobalSettingVisible(true);
  };

  useEffect(() => {
    initialize();
    return () => {
      destroy();
    };
  }, [isUserSettingOpen]);

  const initialize = async () => {
    const response = await appHelper.apiPost(
      "model-provider/find-model-provider",
    );
    setModelProviders(response.data);
  };

  const destroy = async () => {};

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
                value={""}
              />
            </Group>
            <Group justify={"space-between"}>
              <Text size={"sm"}>系统配置</Text>
            </Group>
            <Card withBorder shadow="sm" radius={"md"}>
              <Group justify={"space-between"}>
                <Group>
                  <Settings size={40} color={theme.colors.blue[6]}></Settings>
                  <Flex direction={"column"}>
                    <Text fw={"bold"} size={"sm"}>
                      系统配置
                    </Text>
                    <Text size={"xs"} c={"dimmed"}>
                      配置全局模型
                    </Text>
                  </Flex>
                </Group>
                <ActionIcon
                  variant={"light"}
                  onClick={onOpenModelGlobalSetting}
                >
                  <Settings size={16} />
                </ActionIcon>
              </Group>
            </Card>
            <Group justify={"space-between"}>
              <Text size={"sm"}>提供商列表</Text>
              <Button
                variant={"light"}
                leftSection={<Blocks size={16} />}
                size={"xs"}
              >
                添加模型
              </Button>
            </Group>
            <ModelProviderCard
              onOpenModelSetting={onOpenModelSetting}
              modelProviders={modelProviders}
            />
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="members" px={"lg"}>
          Messages tab content
        </Tabs.Panel>
      </Tabs>
      <ModelSetting
        modelProviderInfo={currentModelProvider}
        opened={isModelSettingVisible}
        onUpdated={() => {
          initialize();
        }}
        onClose={() => setIsModelSettingVisible(false)}
      />
      <ModelGlobalSetting
        modelProviders={modelProviders}
        opened={isModalGlobalSettingVisible}
        onUpdated={() => {}}
        onClose={() => setIsModalGlobalSettingVisible(false)}
      />
    </Modal>
  );
};

const ModelProviderCard = ({ onOpenModelSetting, modelProviders }) => {
  const theme = useMantineTheme();
  return (
    <>
      {appHelper.getLength(modelProviders) > 0 ? (
        modelProviders.map((provider, index) => (
          <Card key={provider.id} shadow="sm" withBorder radius="md">
            <Group justify="space-between">
              <Flex direction="column">
                <Group mb="xs" justify="space-between">
                  <Group gap="sm" align="space-between">
                    <Image src={QWen} w={45} h={45} />
                    <Flex direction="column" justify="space-between">
                      <Text size="sm" fw="bold">
                        {provider.name}
                      </Text>
                      {!provider.api_key ? (
                        <Badge
                          size="xs"
                          variant="light"
                          color={theme.colors.yellow[8]}
                          leftSection={
                            <CircleAlert
                              size={12}
                              color={theme.colors.yellow[8]}
                            />
                          }
                        >
                          请配置 API KEY
                        </Badge>
                      ) : (
                        <Badge
                          size="xs"
                          variant="light"
                          color={theme.colors.green[8]}
                          leftSection={
                            <Check size={12} color={theme.colors.green[8]} />
                          }
                        >
                          已就绪
                        </Badge>
                      )}
                    </Flex>
                  </Group>
                </Group>

                <Group gap="xs">
                  {appHelper.getLength(provider.types) > 0 &&
                    provider.types.map((type, index) => (
                      <Badge
                        color={theme.colors.violet[6]}
                        size="xs"
                        variant={"dot"}
                      >
                        {type}
                      </Badge>
                    ))}
                </Group>
              </Flex>

              <ActionIcon
                variant="light"
                onClick={() => {
                  onOpenModelSetting(provider);
                }}
              >
                <Settings2 size={16} />
              </ActionIcon>
            </Group>
          </Card>
        ))
      ) : (
        <Stack align={"center"}>
          <Image src={NoData} w={200} h={200} />
          <Button variant={"light"} leftSection={<Blocks size={16} />}>
            前往插件市场
          </Button>
        </Stack>
      )}
    </>
  );
};

export { UserSettings };
