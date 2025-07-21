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
  ActionIcon,
  TextInput,
  Title,
  useMantineTheme,
  Blockquote,
} from "@mantine/core";
import { useForm } from "@mantine/form";

import { Mail, ArrowLeft, CircleAlert, CircleUser } from "lucide-react";
import GoogleIcon from "@/assets/google-icon.svg";
import GithubIcon from "@/assets/github-icon.svg";
import zettaLogo from "@/assets/zetta-logo.svg";
import React from "react";
import { useNotify } from "@/utils/notify.js";
import { useNavigate } from "react-router-dom";

const UserRegister = () => {
  const theme = useMantineTheme();
  const { notify } = useNotify();
  const nav = useNavigate();

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      lastName: "", // 姓
      firstName: "", // 名
      email: "",
      password: "",
      confirmPassword: "",
    },

    validate: {
      lastName: (value) => {
        console.log(111, value);
        return value.trim() ? null : "姓不能为空";
      },
      firstName: (value) => (value.trim() ? null : "名不能为空"),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "邮箱地址无效"),
      password: (value) => (value.length >= 8 ? null : "密码至少需要8个字符"),
      confirmPassword: (value, values) =>
        value === values.password ? null : "密码不匹配",
    },
  });

  return (
    <Flex h={"100vh"} p={"xl"} direction={"column"}>
      <Image src={zettaLogo} w={142} h={40} />
      <Center flex={1}>
        <Card p={"md"} miw={450} withBorder>
          <Flex direction={"column"} gap={"xs"}>
            <Group mb={"md"}>
              <ActionIcon
                radius={"xl"}
                variant={"light"}
                onClick={() => {
                  nav(-1);
                }}
              >
                <ArrowLeft size={18} />
              </ActionIcon>
              <Title order={3}>创建新账户</Title>
            </Group>
          </Flex>
          <form onSubmit={form.onSubmit((values) => console.log(values))}>
            <Stack mb={"md"}>
              <Group>
                <TextInput
                  withAsterisk
                  label={"姓"}
                  key={form.key("lastName")}
                  inputSize={"sm"}
                  placeholder={"姓"}
                  {...form.getInputProps("lastName")}
                />
                <TextInput
                  withAsterisk
                  label={"名"}
                  key={form.key("firstName")}
                  inputSize={"sm"}
                  placeholder={"名"}
                  {...form.getInputProps("firstName")}
                />
              </Group>
              <TextInput
                withAsterisk
                label={"邮箱"}
                key={form.key("email")}
                placeholder={"请输入邮箱地址"}
                {...form.getInputProps("email")}
              />
              <TextInput
                withAsterisk
                type={"password"}
                key={form.key("password")}
                label={"密码"}
                placeholder={"至少8位, 包含数字和字母"}
                {...form.getInputProps("password")}
              />
              <TextInput
                withAsterisk
                type={"password"}
                key={form.key("confirmPassword")}
                label={"确认密码"}
                placeholder={"请确认密码"}
                {...form.getInputProps("confirmPassword")}
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
                  密码要求：至少8位字符，包含大小写字母、数字和特殊字符
                </Text>
              </Blockquote>
              <Button leftSection={<CircleUser size={18} />} type="submit">
                创建账户
              </Button>
            </Stack>
            <Stack gap={"xs"} align={"center"}>
              <Button variant="transparent" p={0}>
                <Text td="underline" size={"sm"}>
                  已有账号？立即登录
                </Text>
              </Button>
            </Stack>
          </form>
        </Card>
      </Center>
    </Flex>
  );
};

export { UserRegister };
