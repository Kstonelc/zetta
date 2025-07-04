import { ImageUp } from "lucide-react";
import { ActionIcon, useMantineTheme } from "@mantine/core";

const InsertImageButton = ({ editor }) => {
  const theme = useMantineTheme();
  const handleClick = () => {
    const url = window.prompt("请输入图片地址:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <ActionIcon onClick={handleClick} size="sm" variant={"subtle"}>
      <ImageUp size={16} color={theme.colors.gray[7]} />
    </ActionIcon>
  );
};

export { InsertImageButton };
