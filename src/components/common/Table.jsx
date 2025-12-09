import { DataTable } from "mantine-datatable";
import { Stack, Text, Image } from "@mantine/core";
import NoRecords from "/assets/wiki/no-records.png";

const Table = ({ columns, data, excludeAccessors = ["option"], ...props }) => {
  const processedColumns = columns.map((column) => {
    const accessorName = column.accessor;

    if (!accessorName || excludeAccessors.includes(accessorName)) {
      return column;
    }

    const originalRender = column.render;

    return {
      ...column,
      render: (record) => {
        const cellValue = record[accessorName];

        if (cellValue === null || cellValue === undefined || cellValue === "") {
          return "-";
        }

        if (originalRender) {
          return originalRender(record);
        }

        return cellValue;
      },
    };
  });

  const renderNoRecords = () => {
    return (
      <Stack align={"center"} gap={"2"}>
        <Image src={NoRecords} w={120} h={120}></Image>
        <Text size={"xs"}>空空如也</Text>
      </Stack>
    );
  };

  return (
    <DataTable
      verticalSpacing={"6"}
      withRowBorders={true}
      striped={true}
      highlightOnHover
      records={data}
      columns={processedColumns}
      emptyState={renderNoRecords()}
      {...props}
    />
  );
};

export { Table };
