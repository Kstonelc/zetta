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
import React, { useRef, useState } from "react";
import { useNotify } from "@/utils/notify.js";
import { useNavigate } from "react-router-dom";
import appHelper from "@/AppHelper.js";

class UserForgotPasswordState {
  static {
    // 枚举值
    this.SendCode = 1 << 0;
    this.VerifyCode = 1 << 1;
    this.ResetPassword = 1 << 2;
  }
}

const UserForgotPassword = () => {
  const theme = useMantineTheme();
  const { notify } = useNotify();
  const nav = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [pageState, setPageState] = useState(UserForgotPasswordState.SendCode);
  const [userVerificationCode, setUserVerificationCode] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [newPassword, setNewPassword] = useState("");
  const [newConfirmPassword, setNewConfirmPassword] = useState("");

  const sendVerifyCodeTimer = useRef(null);

  // region 方法

  const onSendVerifyCode = async () => {
    if (!userEmail) {
      notify({
        message: "请输入邮箱",
        type: "error",
      });
      return;
    }
    let response = await appHelper.apiPost("/user/send-verification-code", {
      userEmail: userEmail,
    });
    if (!response.ok) {
      notify({
        message: response.message,
        type: "error",
      });
      return;
    }
    notify({
      message: "验证码已发送",
      type: "success",
    });
    if (remaining > 0) return;
    setRemaining(20);
    if (sendVerifyCodeTimer.current) {
      clearInterval(sendVerifyCodeTimer.current);
      sendVerifyCodeTimer.current = null;
    }
    sendVerifyCodeTimer.current = setInterval(() => {
      setRemaining((remaining) => remaining - 1);
    }, 1000);
    setPageState(UserForgotPasswordState.VerifyCode);
  };

  const onVerifyCode = async () => {
    if (!userVerificationCode) {
      notify({
        message: "请输入验证码",
        type: "error",
      });
      return;
    }
    const response = await appHelper.apiPost("/user/verify-code", {
      userEmail: userEmail,
      userVerificationCode: userVerificationCode,
    });
    if (!response.ok) {
      notify({
        message: response.message,
        type: "error",
      });
      return;
    }
    setPageState(UserForgotPasswordState.ResetPassword);
  };

  const onResetPassword = async () => {
    if (
      appHelper.getLength(newPassword) < 6 ||
      appHelper.getLength(newPassword) > 32
    ) {
      notify({
        message: "密码长度必须在 6-32 个字符之间",
        type: "error",
      });
      return;
    }
    const response = await appHelper.apiPost("/user/update-user-password", {
      userEmail: userEmail,
      userPassword: newPassword,
      userConfirmPassword: newConfirmPassword,
    });
    if (!response.ok) {
      notify({
        message: response.message,
        type: "error",
      });
      return;
    }
    notify({
      message: "密码重置成功,请重新登录",
      type: "success",
    });
    nav({
      pathname: "/user/login",
    });
  };

  const renderContent = () => {
    switch (pageState) {
      case UserForgotPasswordState.SendCode:
        return (
          <>
            <TextInput
              key={"uerEmail"}
              label={"邮箱"}
              onChange={(e) => {
                setUserEmail(e.target.value);
              }}
              placeholder={"请输入您注册时使用的邮箱"}
              withAsterisk
            />
            <Button
              leftSection={<Mail size={16} />}
              onClick={onSendVerifyCode}
              disabled={remaining > 0}
            >
              {remaining > 0 ? `请等待 ${remaining}s` : "发送验证码"}
            </Button>
          </>
        );

      case UserForgotPasswordState.VerifyCode:
        return (
          <>
            <TextInput
              key={"userVerificationCode"}
              label={"验证码"}
              placeholder={"请输入您收到的验证码"}
              withAsterisk
              onChange={(e) => {
                setUserVerificationCode(e.target.value);
              }}
            />
            <Button leftSection={<Mail size={16} />} onClick={onVerifyCode}>
              验证
            </Button>
          </>
        );

      case UserForgotPasswordState.ResetPassword:
        return (
          <>
            <TextInput
              type={"password"}
              key={"newPassword"}
              label={"新密码"}
              placeholder={"请输入新密码"}
              withAsterisk
              onChange={(e) => {
                setNewPassword(e.target.value);
              }}
            />
            <TextInput
              type={"password"}
              key={"newConfirmPassword"}
              label={"确认密码"}
              placeholder={"请输入确认密码"}
              withAsterisk
              error={
                newPassword !== newConfirmPassword
                  ? "两次输入的密码不一致"
                  : undefined
              }
              onChange={(e) => {
                setNewConfirmPassword(e.target.value);
              }}
            />
            <Button leftSection={<Send size={16} />} onClick={onResetPassword}>
              重置密码
            </Button>
          </>
        );
    }
  };

  // endregion

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
                  if (pageState === UserForgotPasswordState.SendCode) {
                    nav(-1);
                  }
                  if (pageState === UserForgotPasswordState.VerifyCode) {
                    setUserEmail("");
                    setPageState(UserForgotPasswordState.SendCode);
                  }
                  if (pageState === UserForgotPasswordState.ResetPassword) {
                    setUserVerificationCode("");
                    setPageState(UserForgotPasswordState.VerifyCode);
                  }
                }}
              >
                <ArrowLeft size={18} />
              </ActionIcon>
              <Title order={3}>重置密码</Title>
            </Group>
          </Flex>
          <Stack mb={"md"}>
            {renderContent()}
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
        </Card>
      </Center>
    </Flex>
  );
};

export { UserForgotPassword };
