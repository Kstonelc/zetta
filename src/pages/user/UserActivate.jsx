import {
  Blockquote,
  Button,
  Card,
  Center,
  Flex,
  Group,
  Image,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import zettaLogo from "@/assets/zetta-logo.svg";
import { Sparkles } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useForm } from "@mantine/form";
import appHelper from "@/AppHelper.js";
import { useNotify } from "@/utils/notify";

const UserActivate = () => {
  const { search } = useLocation(); // 获取 "?email=...&token=..."
  const query = new URLSearchParams(search);
  const { notify } = useNotify();
  const formActivate = useForm({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validate: {
      password: (value) =>
        value.length >= 8 && value.length <= 32 ? null : "密码6-32个字符",
      confirmPassword: (value, values) =>
        value === values.password ? null : "密码不一致",
    },
  });

  const activateEmailRef = useRef("");
  const activateTokenRef = useRef("");

  // region 初始化

  useEffect(() => {
    initialize();
    return () => {
      destroy();
    };
  }, []);

  const initialize = async () => {
    console.log("激活信息", query.get("email"), query.get("token"));
    activateEmailRef.current = query.get("email");
    activateTokenRef.current = query.get("token");
  };

  const destroy = async () => {};

  // endregion

  //region 方法

  const onActivateUser = async (values) => {
    const response = await appHelper.apiPost("/user/activate", {
      userEmail: activateEmailRef.current,
      userToken: activateTokenRef.current,
      userPassword: values.password,
      userConfirmPassword: values.confirmPassword,
    });
    if (!response.ok) {
      notify({
        type: "error",
        message: response.message,
      });
      return;
    }
  };

  //endregion
  return (
    <Flex h={"100vh"} p={"xl"} direction={"column"}>
      <Image src={zettaLogo} w={142} h={40} />
      <Center flex={1}>
        <Card p={"md"} miw={450} withBorder>
          <Flex direction={"column"} gap={"xs"}>
            <Title order={3}>🤖 激活Zetta</Title>
            <Text c="dimmed" size={"sm"} mb={"md"}>
              欢迎您加入 Zetta, 下面设置您的密码 ！
            </Text>
          </Flex>
          <form
            onSubmit={formActivate.onSubmit((values) => onActivateUser(values))}
          >
            <Stack mb={"md"}>
              <TextInput
                type={"password"}
                label={"密码"}
                withAsterisk
                key={formActivate.key("password")}
                inputSize={"sm"}
                {...formActivate.getInputProps("password")}
              />
              <TextInput
                type={"password"}
                withAsterisk
                key={formActivate.key("confirmPassword")}
                label={"确认密码"}
                {...formActivate.getInputProps("confirmPassword")}
              />
              <Button leftSection={<Sparkles size={16} />} type="submit">
                激活
              </Button>
            </Stack>
          </form>
        </Card>
      </Center>
    </Flex>
  );
};

export { UserActivate };
