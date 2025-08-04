import { Modal } from "@/components";
import { Button, Text, Group, useMantineTheme } from "@mantine/core";

const WikiCreateCancelModal = ({ opened, onClose }) => {
  const theme = useMantineTheme();

  return (
    <Modal
      opened={opened}
      title={
        <Text fw={"bold"} size={"lg"}>
          退出
        </Text>
      }
      description="临时数据不会被保存"
      onClose={onClose}
    >
      <Group grow>
        <Button
          variant={"subtle"}
          color={theme.colors.gray[6]}
          onClick={onClose}
        >
          我再想想
        </Button>
        <Button>确定</Button>
      </Group>
    </Modal>
  );
};

export { WikiCreateCancelModal };
