import { Box, Flex, ScrollArea, Text, useMantineTheme } from "@mantine/core";

const Slider = () => {
  const theme = useMantineTheme();

  return (
    <Flex h="100vh">
      {/* Sidebar */}
      <Box
        w={260}
        p="md"
        style={{ borderRight: `1px solid ${theme.colors.gray[3]}` }}
      >
        <ScrollArea>
          <Text fw={700} mb="md">
            菜单
          </Text>
          {/* 添加导航项 */}
          <Text>首页</Text>
          <Text>项目</Text>
          <Text>设置</Text>
        </ScrollArea>
      </Box>

      {/* Main content */}
      <Box flex={1} p="md">
        <Text size="xl" fw={600}>
          页面内容区域
        </Text>
        {/* 这里可以插入实际内容组件 */}
      </Box>
    </Flex>
  );
};

export { Slider };
