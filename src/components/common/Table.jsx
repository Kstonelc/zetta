import { DataTable } from "mantine-datatable";

const Table = ({ columns, data, ...props }) => {
  return (
    <DataTable
      verticalSpacing={"6"}
      withRowBorders={true}
      striped={true}
      highlightOnHover
      records={data}
      columns={columns}
      {...props}
    />
  );
};

export { Table };
