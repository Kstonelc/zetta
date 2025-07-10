import { ImageUp } from "lucide-react";
import { ActionIcon, useMantineTheme } from "@mantine/core";

const InsertImageButton = ({ editor }) => {
  const theme = useMantineTheme();
  const handleClick = () => {
    editor.chain().focus().insertContent({ type: "imageUploader" }).run();
  };

  return (
    <ActionIcon onClick={handleClick} size="sm" variant={"subtle"}>
      <ImageUp size={16} color={theme.colors.gray[7]} />
    </ActionIcon>
  );
};

export { InsertImageButton };
