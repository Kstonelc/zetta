import {
  Box,
  Button,
  Flex,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import React, { useEffect, useRef, useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const ChatBox=() =>{
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '你好，我是 AI，有什么可以帮你？' },
  ]);
  const [input, setInput] = useState<string>('');
  const chatContentRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // 模拟 AI 回复
    setTimeout(() => {
      const botReply = { role: 'assistant', content: '收到！' };
      setMessages((prev) => [...prev, botReply]);
    }, 600);
  };

  // 自动滚动到底部
  useEffect(() => {
    chatContentRef.current?.scrollTo({ top: chatContentRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <Flex
      direction="column"
      h="80vh"
      bdrs="md"
      px="md"
      py="sm"
      bg="gray.0"
    >
      <ScrollArea
        flex={1}
        viewportRef={chatContentRef}
        offsetScrollbars
        type="always"
      >
        <Stack gap="xs" py="xs">
          {messages.map((msg, idx) => (
            <Flex
              key={idx}
              justify={msg.role === 'user' ? 'flex-end' : 'flex-start'}
            >
              <Paper
                bg={msg.role === 'user' ? 'blue.2' : 'gray.2'}
                p="sm"
                radius="md"
                shadow="xs"
                maw="70%"
              >
                <Text size="sm">{msg.content}</Text>
              </Paper>
            </Flex>
          ))}
        </Stack>
      </ScrollArea>

      <Box
        style={{
          paddingTop: 8,
        }}
      >
        <Flex gap="sm">
          <Textarea
            placeholder="输入消息..."
            autosize
            minRows={1}
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button onClick={handleSend}>发送</Button>
        </Flex>
      </Box>
    </Flex>
  );
}


export {ChatBox}