import {
  Flex,
  Text,
  Card,
  Button,
  Group,
  Divider,
  Image,
  Stack,
  Center,
  Title,
  TextInput,
  Blockquote,
  useMantineTheme,
} from "@mantine/core";
import { Loading } from "@/components";
import { CircleAlert, CircleUser, Mail, ShieldUser } from "lucide-react";
import zettaLogo from "@/assets/zetta-logo.svg";
import React, { useEffect, useState } from "react";
import { useNotify } from "@/utils/notify";
import { useUserStore } from "@/stores/useUserStore";
import { useNavigate } from "react-router-dom";
import { useForm } from "@mantine/form";
import appHelper from "@/AppHelper.js";

const UserLogin = () => {
  const { notify } = useNotify();
  const nav = useNavigate();
  const theme = useMantineTheme();
  const { userStore, setUserStore } = useUserStore();
  const formAdmin = useForm({
    mode: "uncontrolled",
    initialValues: {
      email: "",
      name: "",
      password: "",
    },

    validate: {
      name: (value) => (value.trim() ? null : "名不能为空"),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "邮箱地址无效"),
      password: (value) =>
        /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value)
          ? null
          : "至少8位, 包含数字和字母",
    },
  });

  const formLogin = useForm({
    mode: "uncontrolled",
    initialValues: {
      email: "",
      password: "",
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "邮箱地址无效"),
      password: (value) =>
        /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value)
          ? null
          : "至少8位, 包含数字和字母",
    },
  });

  const [isAdminExist, setIsAdminExist] = useState(false);
  const [isReady, setIsReady] = useState(false);

  //region 初始化
  useEffect(() => {
    initialize();
    return () => {
      destroy();
    };
  }, []);

  const initialize = async () => {
    setIsReady(false);
    const response = await appHelper.apiPost("/tenant/find-admin");
    if (response.ok) {
      setIsAdminExist(true);
    } else {
      setIsAdminExist(false);
    }
    setIsReady(true);
  };

  const destroy = async () => {};
  //endregion

  //region 方法

  const onClickReset = async () => {
    nav({
      pathname: "/user/reset-password",
    });
  };

  const onClickLogin = async (values) => {
    let response = await appHelper.apiPost("/user/email-login", {
      userEmail: values.email,
      userPassword: values.password,
    });
    if (!response.ok) {
      notify({
        type: "error",
        message: response.message,
      });
      return;
    }
    appHelper.setAccessToken(response.data.access_token);
    response = await appHelper.apiPost("/user/find-user", {
      userEmail: values.email,
    });
    if (!response.ok) {
      notify({
        type: "error",
        message: response.message,
      });
      return;
    }
    setUserStore(response.data);
    nav({
      pathname: "/",
    });
  };

  //endregion
  return (
    <Loading visible={!isReady} size={"md"}>
      <Flex h={"100vh"} p={"xl"} direction={"column"}>
        <Image src={zettaLogo} w={142} h={40} />
        <Center flex={1}>
          {isAdminExist ? (
            <Card p={"md"} miw={450} withBorder>
              <Flex direction={"column"} gap={"xs"}>
                <Title order={3}>🤖 欢迎回来!</Title>
                <Text c="dimmed" size={"sm"} mb={"md"}>
                  登录 Zetta 以继续
                </Text>
              </Flex>
              <form
                onSubmit={formLogin.onSubmit((values) => onClickLogin(values))}
              >
                <Stack mb={"md"}>
                  <TextInput
                    label={"邮箱"}
                    withAsterisk
                    key={formLogin.key("email")}
                    inputSize={"sm"}
                    {...formLogin.getInputProps("email")}
                  />
                  <TextInput
                    withAsterisk
                    key={formLogin.key("password")}
                    label={"密码"}
                    type={"password"}
                    {...formLogin.getInputProps("password")}
                  />
                  <Button leftSection={<Mail size={16} />} type="submit">
                    邮箱登录
                  </Button>
                </Stack>
                <Stack gap={"xs"} align={"center"}>
                  <Button variant="transparent" p={0} onClick={onClickReset}>
                    <Text td="underline" size={"sm"} c={"dimmed"}>
                      糟糕, 忘记密码？
                    </Text>
                  </Button>
                </Stack>
              </form>
            </Card>
          ) : (
            <Card p={"md"} miw={450} withBorder>
              <Flex direction={"column"} gap={"xs"}>
                <Group gap={"xs"}>
                  <ShieldUser size={30} color={theme.colors.blue[6]} />
                  <Title order={3}>设置管理员</Title>
                </Group>
                <Text c="dimmed" size={"xs"} mb={"md"}>
                  管理员拥有Zetta最大权限,可用于创建知识库, 配置大模型等
                </Text>
                <form onSubmit={formAdmin.onSubmit((values) => {})}>
                  <Stack mb={"md"}>
                    <TextInput
                      withAsterisk
                      label={"姓名"}
                      key={formAdmin.key("name")}
                      inputSize={"sm"}
                      placeholder={"姓名"}
                      {...formAdmin.getInputProps("name")}
                    />
                    <TextInput
                      withAsterisk
                      label={"邮箱"}
                      key={formAdmin.key("email")}
                      placeholder={"请输入邮箱地址"}
                      {...formAdmin.getInputProps("email")}
                    />
                    <TextInput
                      withAsterisk
                      type={"password"}
                      key={formAdmin.key("password")}
                      label={"密码"}
                      placeholder={"至少8位, 包含数字和字母"}
                      {...formAdmin.getInputProps("password")}
                    />
                    <Blockquote
                      color={theme.colors.yellow[5]}
                      radius="md"
                      icon={<CircleAlert size={16} />}
                      iconSize={30}
                      p={"sm"}
                      mt="xs"
                    >
                      <Text size={"sm"}>
                        密码要求：至少8位字符，包含大小写字母、数字
                      </Text>
                    </Blockquote>
                    <Button
                      leftSection={<CircleUser size={18} />}
                      type="submit"
                    >
                      创建账户
                    </Button>
                  </Stack>
                </form>
              </Flex>
            </Card>
          )}
        </Center>
      </Flex>
    </Loading>
  );
};

export { UserLogin };
