import React, { FC } from "react";
import { Text, Modal as ModalMT, ModalProps, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

interface CustomModalProps extends Omit<ModalProps, "opened" | "onClose"> {
  trigger?: React.ReactElement<{ onClick?: React.MouseEventHandler }>;
  description?: string;
}

const Modal: FC<CustomModalProps> = ({
  children,
  title,
  trigger,
  description,
  ...props
}) => {
  const [isOpen, { open, close }] = useDisclosure(false);

  const triggerWithOpen = React.isValidElement(trigger)
    ? React.cloneElement(trigger, {
        onClick: (e: React.MouseEvent) => {
          trigger.props.onClick?.(e);
          open();
        },
      })
    : null;

  return (
    <>
      {triggerWithOpen}
      <ModalMT
        opened={isOpen}
        onClose={close}
        title={title}
        centered
        radius={"md"}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        {...props}
      >
        <Stack gap="md">
          {description && (
            <Text size="sm" c="dimmed">
              {description}
            </Text>
          )}
          {children}
        </Stack>
      </ModalMT>
    </>
  );
};

export { Modal };
