import {
  Flex,
  Stack,
  Text,
  Group,
  Button,
  Title,
  Card,
  ScrollArea,
  Paper,
  Badge,
  Menu,
  Loader,
  Anchor,
  Breadcrumbs,
  useMantineTheme,
  Input,
  Image,
  ActionIcon,
} from "@mantine/core";
import FatherSon from "/assets/wiki/father-son.svg";
import {
  FolderUp,
  SquarePen,
  Trash2,
  CircleCheckBig,
  CircleX,
  Search,
  FileText,
  FolderOpenDot,
  ChevronRight,
} from "lucide-react";
import Folder from "/folder.png";
import LocalFile from "/local-file.png";
import { Table } from "@/components/index.js";

import QWen from "/assets/models/qwen.svg";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import appHelper from "@/AppHelper.js";
import { DocumentIndexStatus, FileType, WikiChunkType } from "@/enum.ts";

const WikiDetail = () => {
  const theme = useMantineTheme();
  const nav = useNavigate();
  const { wikiId } = useParams();
  const [docs, setDocs] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  const columns = [
    {
      accessor: "title",
      title: "名称",
      textAlign: "center",
      width: 300,
      render: ({ title }) => (
        <Group justify={"center"} gap={"xs"} wrap={"noWrap"}>
          {renderFileIcon(appHelper.getFileExt(title))}
          <Text size={"sm"}>{title}</Text>
        </Group>
      ),
    },
    {
      accessor: "size",
      title: "大小",
      textAlign: "center",
      width: 50,
      render: ({ size }) => (
        <Text size={"sm"}>{appHelper.getFileSize(size)}</Text>
      ),
    },
    {
      title: "分段模式",
      accessor: "chunk_type",
      textAlign: "center",
      render: ({ chunk_type }) => {
        return (
          <Badge
            color={theme.colors.gray[6]}
            variant={"outline"}
            size={"sm"}
            radius={"sm"}
            leftSection={<Image src={FatherSon} w={12} h={12} />}
          >
            {WikiChunkType.text[chunk_type]}
          </Badge>
        );
      },
    },
    {
      accessor: "status",
      title: "状态",
      textAlign: "center",
      width: 100,
      render: ({ status }) => {
        return renderDocumentStatus(status);
      },
    },
    {
      accessor: "created_at",
      title: "上传时间",
      textAlign: "center",
      render: ({ created_at }) => (
        <Text size={"sm"}>
          {appHelper.formatDate(created_at, "YYYY-MM-DD HH:mm:ss")}
        </Text>
      ),
    },
    {
      accessor: "option",
      title: "操作",
      textAlign: "center",
      width: 200,
      render: () => (
        <Group gap={"0"} justify={"center"}>
          <ActionIcon variant={"transparent"}>
            <SquarePen size={"16"} />
          </ActionIcon>
          <ActionIcon variant={"transparent"}>
            <Trash2 size={"16"} color={theme.colors.red[6]} />
          </ActionIcon>
        </Group>
      ),
    },
  ];

  // region 初始化

  useEffect(() => {
    initialize();
    return () => {
      destroy();
    };
  }, []);

  const initialize = async () => {
    await getWikiDocs();
  };

  const destroy = async () => {};

  // endregion

  // region 方法

  const getWikiDocs = async () => {
    setIsFetching(true);
    const response = await appHelper.apiPost("/wiki/find-docs", {
      wikiId: wikiId,
    });
    if (!response.ok) {
      setIsFetching(false);
      return;
    }
    setIsFetching(false);
    setDocs(response.data);
  };

  // endregion

  // region 组件渲染

  const renderDocumentStatus = (status) => {
    switch (status) {
      case DocumentIndexStatus.Success:
        return (
          <Badge
            variant={"light"}
            size={"sm"}
            color={theme.colors.green[5]}
            leftSection={<CircleCheckBig size={12} />}
          >
            {DocumentIndexStatus.text[status]}
          </Badge>
        );
      case DocumentIndexStatus.Failed:
        return (
          <Badge
            variant={"light"}
            size={"sm"}
            color={theme.colors.red[6]}
            leftSection={<CircleX size={12} />}
          >
            {DocumentIndexStatus.text[status]}
          </Badge>
        );
      default:
        return (
          <Badge
            variant={"light"}
            size={"sm"}
            leftSection={<Loader type="dots" size={"xs"} />}
          >
            {DocumentIndexStatus.text[status]}
          </Badge>
        );
    }
  };

  const renderFileIcon = (fileExt) => {
    return (
      <Image src={FileType.icon[FileType.getFileType(fileExt)]} w={20} h={20} />
    );
  };

  // 定一个属性结构 后端返回
  const items = [
    { title: "根目录", href: "#" },
    { title: "react native", href: "#" },
    { title: "base", href: "#" },
  ].map((item, index) => (
    <Anchor href={item.href} key={index} underline={"never"}>
      <Button
        c={theme.colors.gray[7]}
        fw={"bold"}
        size={"xs"}
        variant={"subtle"}
      >
        {item.title}
      </Button>
    </Anchor>
  ));

  // endregion

  return (
    <Stack flex={1} h={"calc(100vh - 120px)"}>
      <Title order={3}>文档</Title>
      <Group justify={"space-between"}>
        <Breadcrumbs
          separator={<ChevronRight size={16} />}
          separatorMargin="0"
          mt="xs"
        >
          {items}
        </Breadcrumbs>
        <Group>
          <Input
            size={"xs"}
            placeholder={"文件名"}
            leftSection={<Search size={16} />}
          />
          <Menu>
            <Menu.Target>
              <Button leftSection={<FolderUp size={16} />}>新建/导入</Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item leftSection={<Image src={Folder} w={20} h={20} />}>
                文件夹
              </Menu.Item>
              <Menu.Item
                leftSection={<Image src={LocalFile} w={14} h={20} />}
                onClick={() => {
                  nav(`/wiki/detail/${wikiId}/docs/create`);
                }}
              >
                本地文件
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Stack flex={5} px={"md"} mih={0}>
        <Table
          data={docs}
          totalRecords={appHelper.getLength(docs)}
          fetching={isFetching}
          columns={columns}
          selectedRecords={selectedRecords}
          onSelectedRecordsChange={setSelectedRecords}
        />
      </Stack>
    </Stack>
  );
};

export { WikiDetail };
