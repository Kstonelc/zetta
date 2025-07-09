import { useMantineTheme } from "@mantine/core";
import { notifications } from "@mantine/notifications";

type NotifyType = "success" | "error" | "info" | "warning";

export function useNotify() {
  const theme = useMantineTheme();

  const colorMap: Record<NotifyType, string> = {
    success: theme.colors.green[6],
    error: theme.colors.red[6],
    info: theme.colors.blue[6],
    warning: theme.colors.yellow[6],
  };

  const notify = ({
    message,
    type = "info",
    autoClose = 3000,
  }: {
    message: string;
    type?: NotifyType;
    autoClose?: number;
  }) => {
    notifications.show({
      message,
      withCloseButton: false,
      color: colorMap[type],
      autoClose,
    });
  };

  return { notify };
}
