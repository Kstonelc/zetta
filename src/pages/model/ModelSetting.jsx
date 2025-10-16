import {
  Button,
  Card,
  Flex,
  Group,
  Image,
  Stack,
  Switch,
  Text,
  Badge,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { Save, SquareArrowOutUpRight } from "lucide-react";
import QWen from "/assets/models/qwen.svg";
import { Drawer } from "@/components/index.js";
import React, { useEffect, useRef, useState } from "react";
import { useNotify } from "@/utils/notify.ts";
import appHelper from "@/AppHelper.js";
import { ModelProviderUpdateType } from "@/enum.js";

const ModelSetting = ({ modelProviderInfo, opened, onUpdated, onClose }) => {
  const theme = useMantineTheme();
  const { notify } = useNotify();
  const modelProviderId = useRef(null);

  const [modelApiKey, setModelApiKey] = useState(modelProviderInfo?.api_key);
  const [isUpdatingApiKey, setIsUpdatingApiKey] = useState(false);
  const [models, setModels] = useState([]);

  //region 初始化
  useEffect(() => {
    initialize();
    return () => {
      destroy();
    };
  }, [modelProviderInfo]);

  const initialize = async () => {
    modelProviderId.current = modelProviderInfo?.id;

    setModelApiKey(modelProviderInfo?.api_key);
    setModels(modelProviderInfo?.models);
  };
  const destroy = async () => {};
  //endregion

  //region 方法

  const onUpdateApiKey = async (
    modelApiKey,
    type = ModelProviderUpdateType.Update,
  ) => {
    if (!modelApiKey && type === ModelProviderUpdateType.Update) {
      notify({
        type: "error",
        message: "API_KEY不能为空",
      });
      return;
    }
    setIsUpdatingApiKey(true);
    const response = await appHelper.apiPost(
      "/model-provider/update-model-provider",
      {
        modelProviderId: modelProviderId.current,
        modelProviderApiKey: modelApiKey,
        modelProviderUpdateType: type,
      },
    );
    if (!response.ok) {
      setIsUpdatingApiKey(false);
      notify({
        type: "error",
        message: response.message,
      });
      return;
    }
    onUpdated();
    if (type === ModelProviderUpdateType.Clear) {
      onClose();
    }
    notify({
      type: type === ModelProviderUpdateType.Update ? "success" : "error",
      message: response.data,
    });
    setIsUpdatingApiKey(false);
  };

  const onChangeModelActive = async (event, currentModel) => {
    const checked = event.currentTarget.checked;
    const response = await appHelper.apiPost("/model/update-model", {
      modelId: currentModel.id,
      active: checked,
    });
    if (!response.ok) {
      notify({
        type: "error",
        message: response.message,
      });
      return;
    }
    onUpdated();
  };

  //endregion
  return (
    <Drawer title={"模型配置"} opened={opened} onClose={onClose}>
      <TextInput
        type="password"
        required={true}
        label={"API_KEY"}
        description={"配置API_KEY以激活模型"}
        value={modelApiKey}
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
          onClick={() => window.open(appHelper.config.qWenUrl, "_blank")}
        >
          API_KEY如何获取?
        </Button>
      </Flex>
      <Group justify={"flex-end"} mt={-10}>
        <Button
          size={"xs"}
          color={theme.colors.red[8]}
          onClick={async () => {
            await onUpdateApiKey("", ModelProviderUpdateType.Clear);
          }}
        >
          移除
        </Button>
        <Button
          size={"xs"}
          variant={"filled"}
          color={theme.colors.gray[5]}
          onClick={() => {
            onClose();
          }}
        >
          取消
        </Button>
        <Button
          size={"xs"}
          leftSection={<Save size={16} />}
          onClick={async () => {
            await onUpdateApiKey(modelApiKey);
          }}
          loading={isUpdatingApiKey}
        >
          保存
        </Button>
      </Group>
      <Text fw={"bold"}>模型列表</Text>
      <Card withBorder p={"sm"}>
        <Stack gap={"sm"}>
          {appHelper.getLength(models) > 0 ? (
            models.map((model) => (
              <Group justify={"space-between"}>
                <Group>
                  <Image src={QWen} w={30} h={30} />
                  <Text size={"sm"}>{model.name}</Text>
                  {model.max_context_tokens && (
                    <Badge
                      size={"xs"}
                      variant="light"
                      color={theme.colors.gray[6]}
                      radius={"sm"}
                    >
                      {model.max_context_tokens}
                    </Badge>
                  )}
                </Group>
                <Switch
                  defaultChecked={model.active}
                  onClick={async (event) => {
                    await onChangeModelActive(event, model);
                  }}
                />
              </Group>
            ))
          ) : (
            <Text size={"sm"}>没有可用的模型</Text>
          )}
        </Stack>
      </Card>
    </Drawer>
  );
};

export { ModelSetting };
