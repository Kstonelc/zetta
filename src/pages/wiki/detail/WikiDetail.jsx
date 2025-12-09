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
  Switch,
  useMantineTheme,
  TextInput,
  Input,
  Image,
  ActionIcon,
  Modal,
  Transition,
} from "@mantine/core";
import FatherSon from "/assets/wiki/father-son.svg";
import {
  FolderUp,
  ArrowLeft,
  CircleCheckBig,
  CircleX,
  Search,
  ChevronRight,
} from "lucide-react";
import Folder from "/folder.png";
import LocalFile from "/local-file.png";
import { Table } from "@/components/index.js";

import QWen from "/assets/models/qwen.svg";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import appHelper from "@/AppHelper.js";
import { DocumentIndexStatus, FileType, WikiChunkType } from "@/enum.ts";
import { useNotify } from "@/utils/notify.js";
import { lowerFirst } from "@mantine/hooks";

const WikiDetail = () => {
  const theme = useMantineTheme();
  const nav = useNavigate();
  const { notify } = useNotify();
  const { wikiId } = useParams();
  const [docs, setDocs] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isDocCreateModalOpen, setIsDocCreateModalOpen] = useState(false);
  const [folderStruct, setFolderStruct] = useState([
    {
      title: "根目录",
      node_id: null,
    },
  ]);
  const [isActionToolVisible, setIsActionToolVisible] = useState(false);

  const folderNameRef = useRef("");
  const columns = [
    {
      accessor: "title",
      title: "名称",
      textAlign: "flex-start",
      width: 300,
      render: ({ title, isFolder }) => {
        if (isFolder) {
          return (
            <Group justify={"flex-start"} gap={"xs"} wrap={"noWrap"}>
              <Image src={Folder} h={20} w={20}></Image>
              <Text size={"sm"}>{title}</Text>
            </Group>
          );
        } else {
          return (
            <Group justify={"flex-start"} gap={"xs"} wrap={"noWrap"}>
              {renderFileIcon(appHelper.getFileExt(title))}
              <Text size={"sm"}>{title}</Text>
            </Group>
          );
        }
      },
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
      accessor: "chunkType",
      textAlign: "center",
      render: ({ chunkType }) => {
        return (
          <Badge
            color={theme.colors.gray[6]}
            variant={"outline"}
            size={"sm"}
            radius={"sm"}
            leftSection={<Image src={FatherSon} w={12} h={12} />}
          >
            {WikiChunkType.text[chunkType]}
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
      accessor: "createdAt",
      title: "上传时间",
      textAlign: "center",
      render: ({ createdAt }) => (
        <Text size={"sm"}>
          {appHelper.formatDate(createdAt, "YYYY-MM-DD HH:mm:ss")}
        </Text>
      ),
    },
    {
      accessor: "option",
      title: "启用",
      textAlign: "center",
      width: 200,
      render: ({ isFolder }) => {
        if (!isFolder) {
          return (
            <Group gap={"0"} justify={"center"}>
              <Switch defaultChecked={true} radius={"xl"} size={"xs"}></Switch>
            </Group>
          );
        }
      },
    },
  ];
  const currentSelectedRecordsRef = useRef([]);

  // region 初始化

  useEffect(() => {
    initialize();
    return () => {
      destroy();
    };
  }, []);

  const initialize = async () => {
    await getWikiDocs(null);
  };

  const destroy = async () => {};

  // endregion

  // region 方法

  const getWikiDocs = async (parentId) => {
    setIsFetching(true);
    const response = await appHelper.apiPost("/wiki/find-docs", {
      wikiId: wikiId,
      parentId: parentId,
    });
    if (!response.ok) {
      setIsFetching(false);
      return;
    }
    setIsFetching(false);
    // 处理返回数据渲染表格
    let docs = [];

    for (const node of response.data) {
      const commonProps = {
        id: node.id,
        title: node.is_folder ? node.name : node.doc_info?.title,
        createdAt: node.is_folder ? node.created_at : node.doc_info?.created_at,
        isFolder: false,
      };

      if (node.is_folder) {
        commonProps.isFolder = true;
        docs.push(commonProps);
      } else {
        const { size, chunk_type, status } = node.doc_info || {};

        docs.push({
          ...commonProps,
          size,
          chunkType: chunk_type,
          status,
        });
      }
    }
    setDocs(docs);
    setSelectedRecords([]);
    setIsActionToolVisible(false);
  };

  const handleRowClick = ({ record }) => {
    setSelectedRecords((prev) => {
      const exists = prev.some((r) => r.id === record.id);

      let newSelected;
      if (exists) {
        newSelected = prev.filter((r) => r.id !== record.id);
      } else {
        newSelected = [...prev, record];
      }

      currentSelectedRecordsRef.current = newSelected;

      setIsActionToolVisible(appHelper.getLength(newSelected) > 0);

      return newSelected;
    });
  };

  const applySelection = (nextSelected) => {
    setSelectedRecords(nextSelected);
    currentSelectedRecordsRef.current = nextSelected;
    setIsActionToolVisible(nextSelected.length > 0);
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

  const items = folderStruct.map((item, index) => (
    <Anchor key={index} underline={"never"} onClick={() => {}}>
      <Button
        c={theme.colors.gray[7]}
        fw={"bold"}
        size={"xs"}
        variant={"subtle"}
        onClick={async () => {
          await getWikiDocs(item.node_id);
          setFolderStruct(
            folderStruct.slice(0, index + 1).map((item) => {
              return {
                ...item,
                node_id: item.node_id,
              };
            }),
          );
        }}
      >
        {item.title}
      </Button>
    </Anchor>
  ));

  // endregion

  return (
    <Stack flex={1} h={"calc(100vh - 120px)"}>
      <Group gap={"sm"}>
        <ActionIcon variant={"subtle"} color={theme.black} size={"lg"}>
          <ArrowLeft />
        </ActionIcon>
        <Title order={3}>文档</Title>
      </Group>
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
              <Menu.Item
                leftSection={<Image src={Folder} w={20} h={20} />}
                onClick={() => {
                  setIsDocCreateModalOpen(true);
                }}
              >
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

      <Stack flex={5} mih={0}>
        <Table
          data={docs}
          rowIdAccessor={"id"}
          totalRecords={appHelper.getLength(docs)}
          fetching={isFetching}
          columns={columns}
          selectedRecords={selectedRecords}
          onSelectedRecordsChange={applySelection}
          onRowClick={handleRowClick}
          getRecordSelectionCheckboxProps={(record, index) => ({
            onChange: () => {
              handleRowClick({ record });
            },
          })}
          onRowDoubleClick={async ({ record }) => {
            if (!record.isFolder) {
              return;
            }
            folderStruct.push({
              title: record.title,
              id: record.id,
            });
            setFolderStruct(folderStruct);
            await getWikiDocs(record.id);
          }}
        />
        <Transition
          mounted={isActionToolVisible}
          transition="slide-down"
          duration={400}
          timingFunction="ease"
        >
          {(styles) => (
            <Card
              style={styles}
              p={"xs"}
              shadow={"sm"}
              mx={"20%"}
              withBorder={true}
              radius={"lg"}
            >
              <Group w="100%" justify={"space-between"}>
                <Text size={"xs"} fw={"bold"}>
                  已经选择 {appHelper.getLength(selectedRecords)} 项
                </Text>
                <Group gap={0}>
                  <Button size={"xs"} variant={"transparent"}>
                    移动
                  </Button>
                  <Button
                    size={"xs"}
                    variant={"transparent"}
                    onClick={() => {
                      setSelectedRecords([]);
                      setIsActionToolVisible(false);
                    }}
                  >
                    取消选择
                  </Button>
                </Group>
              </Group>
            </Card>
          )}
        </Transition>
      </Stack>
      <Modal
        opened={isDocCreateModalOpen}
        onClose={() => {
          setIsDocCreateModalOpen(false);
        }}
        title={<Text fw={"bold"}>文件夹名称</Text>}
      >
        <TextInput
          label={"名称"}
          placeholder={"请输入文件夹名称"}
          mb={"md"}
          onChange={(e) => {
            folderNameRef.current = e.target.value;
          }}
        />
        <Group grow>
          <Button
            variant={"subtle"}
            onClick={() => {
              setIsDocCreateModalOpen(false);
            }}
          >
            取消
          </Button>
          <Button
            onClick={async () => {
              if (!appHelper.getLength(folderNameRef.current) > 0) {
                notify({
                  type: "warning",
                  message: "请输入文件夹名称",
                });
              }
              const response = await appHelper.apiPost("/wiki/create-folder", {
                wikiId: wikiId,
                folderName: folderNameRef.current,
                parentId: null,
              });
              if (!response.ok) {
                notify({
                  type: "error",
                  message: response.message,
                });
                setIsDocCreateModalOpen(false);
                return;
              }
              setIsDocCreateModalOpen(false);
              await getWikiDocs(null);
            }}
          >
            确定
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
};

export { WikiDetail };
