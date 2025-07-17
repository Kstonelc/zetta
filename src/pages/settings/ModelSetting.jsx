import {
  Button,
  Card,
  Flex,
  Group,
  Image,
  Stack,
  Switch,
  Text,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { ArrowUpRight, SquareArrowOutUpRight } from "lucide-react";
import QWen from "@/assets/models/qwen.svg";
import { Drawer } from "@/components/index.js";
import React, { useEffect, useRef, useState } from "react";
import { useNotify } from "@/utils/notify.js";
import appHelper from "@/AppHelper";

const ModelSetting = ({ modelProviderInfo, opened, onClose }) => {
  const theme = useMantineTheme();
  const { notify } = useNotify();
  const modelProviderId = useRef(null);
  console.log(222, modelProviderInfo);

  const [modelApiKey, setModelApiKey] = useState(modelProviderInfo?.api_key);
  const [isUpdatingApiKey, setIsUpdatingApiKey] = useState(false);

  //region 初始化
  useEffect(() => {
    initialize();
    return () => {
      destroy();
    };
  }, []);

  const initialize = async () => {
    console.log(2222, modelProviderInfo?.api_key);
    modelProviderId.current = modelProviderInfo?.id;
  };
  const destroy = async () => {};
  //endregion

  //region 方法

  const onUpdateApiKey = async () => {
    setIsUpdatingApiKey(true);
    const response = await appHelper.apiPost(
      "/model-provider/update-model-provider",
      {
        modelProviderId: modelProviderId.current,
        modelProviderApiKey: modelApiKey,
      },
    );
    if (!response.ok) {
      notify({
        type: "error",
        message: response.message,
      });
      return;
    }
    notify({
      type: "success",
      message: response.data,
    });
    setIsUpdatingApiKey(false);
  };

  //endregion
  return (
    <Drawer title={"模型配置"} opened={opened} onClose={onClose}>
      <TextInput
        type="password"
        label={"API_KEY"}
        description={"配置API_KEY以激活模型"}
        defaultValue={modelProviderInfo?.api_key}
        onChange={(e) => {
          setModelApiKey(e.target.value);
        }}
      />
      <Flex justify={"flex-start"} mt={-10} align={"center"}>
        <Button
          variant={"transparent"}
          size={"compact-xs"}
          rightSection={
            <SquareArrowOutUpRight size={15} color={theme.colors.blue[8]} />
          }
          onClick={() =>
            window.open("https://bailian.console.aliyun.com/", "_blank")
          }
        >
          API_KEY如何获取?
        </Button>
      </Flex>
      <Group justify={"flex-end"} mt={-10}>
        <Button
          size={"xs"}
          variant={"filled"}
          color={theme.colors.gray[5]}
          onClick={() => {}}
        >
          取消
        </Button>
        <Button size={"xs"} onClick={onUpdateApiKey} loading={isUpdatingApiKey}>
          保存
        </Button>
      </Group>
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
  );
};

export { ModelSetting };
