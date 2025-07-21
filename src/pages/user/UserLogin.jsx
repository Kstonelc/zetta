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
} from "@mantine/core";
import { Mail } from "lucide-react";
import zettaLogo from "@/assets/zetta-logo.svg";
import React, { useState } from "react";
import { useNotify } from "@/utils/notify";
import { useNavigate } from "react-router-dom";

const UserLogin = () => {
  const { notify } = useNotify();
  const nav = useNavigate();

  const [userEmail, setUserEmail] = useState("");

  //region 方法

  const onPressRegister = async () => {
    nav({
      pathname: "/user/register",
    });
  };
  const onPressReset = async () => {
    nav({
      pathname: "/user/reset-password",
    });
  };

  //endregion
  return (
    <Flex h={"100vh"} p={"xl"} direction={"column"}>
      <Image src={zettaLogo} w={142} h={40} />
      <Center flex={1}>
        <Card p={"md"} miw={450} withBorder>
          <Flex direction={"column"} gap={"xs"}>
            <Title order={3}>🤖 欢迎回来!</Title>
            <Text c="dimmed" size={"sm"} mb={"md"}>
              登录 Zetta 以继续
            </Text>
            {/*<Group w={"100%"}>*/}
            {/*  <Button*/}
            {/*    variant={"default"}*/}
            {/*    flex={1}*/}
            {/*    leftSection={<Image src={GithubIcon} w={20} h={20} />}*/}
            {/*    onClick={() => {*/}
            {/*      notify({ message: "正在拼命开发中....", type: "warning" });*/}
            {/*    }}*/}
            {/*  >*/}
            {/*    Github*/}
            {/*  </Button>*/}
            {/*  <Button*/}
            {/*    variant={"default"}*/}
            {/*    flex={1}*/}
            {/*    leftSection={<Image src={GoogleIcon} w={20} h={20} />}*/}
            {/*  >*/}
            {/*    Google*/}
            {/*  </Button>*/}
            {/*</Group>*/}
          </Flex>
          {/*<Divider my="xs" label="或使用邮箱登录" labelPosition="center" />*/}
          <Stack mb={"md"}>
            <TextInput
              label={"邮箱"}
              required={true}
              inputSize={"sm"}
              onChange={(e) => {
                setUserEmail(e.target.value);
              }}
              value={userEmail}
            />
            <TextInput label={"密码"} type={"password"} required={true} />
            <Button leftSection={<Mail size={16} />}>邮箱登录</Button>
          </Stack>
          <Stack gap={"xs"} align={"center"}>
            <Button variant="transparent" p={0} onClick={onPressReset}>
              <Text td="underline" size={"sm"} c={"dimmed"}>
                糟糕, 忘记密码？
              </Text>
            </Button>
            <Group gap={0}>
              <Text c={"dimmed"} size={"sm"}>
                没有账号？
              </Text>
              <Button variant="transparent" p={0} onClick={onPressRegister}>
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
