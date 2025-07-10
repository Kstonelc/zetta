import { Flex, Text, Center, Image, Stack, Button } from "@mantine/core";
import { House } from "lucide-react";
import NotFoundImage from "@/assets/404-not-found.png";

const NotFound = () => {
  return (
    <Center flex={1} h={"100vh"}>
      <Stack jusitfy={"center"} align={"center"} gap={"sm"}>
        <Image src={NotFoundImage} w={600} h={400} />
        <Text size={"xl"} fw={"bold"}>
          啊哦,访问的页面不存在
        </Text>
        <Button leftSection={<House size={16} />}>返回首页</Button>
      </Stack>
    </Center>
  );
};

export { NotFound };
