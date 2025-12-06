import { DataTable } from "mantine-datatable";

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

  return (
    <DataTable
      verticalSpacing={"6"}
      withRowBorders={true}
      striped={true}
      highlightOnHover
      records={data}
      columns={processedColumns}
      {...props}
    />
  );
};

export { Table };
