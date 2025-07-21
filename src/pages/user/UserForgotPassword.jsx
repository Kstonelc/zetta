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
import { Mail, ArrowLeft, CircleAlert, Send } from "lucide-react";
import zettaLogo from "@/assets/zetta-logo.svg";
import React from "react";
import { useNotify } from "@/utils/notify.js";
import { useNavigate } from "react-router-dom";

const UserForgotPassword = () => {
  const theme = useMantineTheme();
  const { notify } = useNotify();
  const nav = useNavigate();
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
              <Title order={3}>重置密码</Title>
            </Group>
          </Flex>
          <Stack mb={"md"}>
            <TextInput
              label={"邮箱"}
              placeholder={"请输入您注册时使用的邮箱"}
              required={true}
            />
            <Button leftSection={<Mail size={16} />}>发送验证码</Button>
            <Blockquote
              color={theme.colors.yellow[5]}
              radius="md"
              icon={<CircleAlert size={16} />}
              iconSize={30}
              p={"sm"}
              mt="xs"
            >
              <Text size={"sm"}>
                重置邮件将包含:
                <ul>
                  <li>验证码</li>
                  <li>密码重置的有效期为10分钟</li>
                  <li>如果您没有收到邮件，请检查垃圾邮件文件夹</li>
                </ul>
              </Text>
            </Blockquote>
          </Stack>
          <Stack gap={"xs"} align={"center"}>
            <Button
              variant="transparent"
              p={0}
              leftSection={<Send size={16} />}
            >
              <Text td="underline" size={"sm"}>
                重新发送邮件
              </Text>
            </Button>
          </Stack>
        </Card>
      </Center>
    </Flex>
  );
};

export { UserForgotPassword };
