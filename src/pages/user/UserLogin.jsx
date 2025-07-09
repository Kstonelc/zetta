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
  useMantineTheme,
} from "@mantine/core";
import { TextInput } from "@/components";
import { Mail } from "lucide-react";
import GoogleIcon from "@/assets/google-icon.svg";
import GithubIcon from "@/assets/github-icon.svg";
import zettaLogo from "@/assets/zetta-logo.svg";
import React from "react";
import { useNotify } from "@/utils/notify.js";

const UserLogin = () => {
  const { notify } = useNotify();
  return (
    <Flex h={"100vh"} p={"xl"} direction={"column"}>
      <Image src={zettaLogo} w={142} h={40} />
      <Center flex={1}>
        <Card shadow={"sm"} p={"md"} miw={450} withBorder={true} bdrs={"md"}>
          <Flex direction={"column"} gap={"xs"}>
            <Title order={3}>🤖 欢迎回来!</Title>
            <Text c="dimmed" size={"sm"} mb={"md"}>
              请选择您的登录方式
            </Text>
            <Group w={"100%"}>
              <Button
                variant={"default"}
                flex={1}
                leftSection={<Image src={GithubIcon} w={20} h={20} />}
                onClick={() => {
                  notify({ message: "正在拼命开发中....", type: "warning" });
                }}
              >
                Github
              </Button>
              <Button
                variant={"default"}
                flex={1}
                leftSection={<Image src={GoogleIcon} w={20} h={20} />}
              >
                Google
              </Button>
            </Group>
          </Flex>
          <Divider my="xs" label="或使用邮箱登录" labelPosition="center" />
          <Stack mb={"md"}>
            <TextInput label={"邮箱"} inputSize={"sm"} />
            <TextInput label={"密码"} />
            <Button leftSection={<Mail size={16} />}>邮箱登录</Button>
          </Stack>
          <Stack gap={"xs"} align={"center"}>
            <Button variant="transparent" p={0}>
              <Text td="underline" size={"sm"} c={"dimmed"}>
                忘记密码？
              </Text>
            </Button>
            <Group gap={0}>
              <Text c={"dimmed"} size={"sm"}>
                没有账号？
              </Text>
              <Button variant="transparent" p={0}>
                <Text td="underline" size={"sm"}>
                  创建一个
                </Text>
              </Button>
            </Group>
          </Stack>
        </Card>
      </Center>
    </Flex>
  );
};

export { UserLogin };
