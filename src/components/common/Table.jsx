import { Box, Button } from "@mantine/core";
import { DataTable } from "mantine-datatable";

const Table = ({ columns, data }) => {
  return (
    <DataTable
      withRowBorders={true}
      striped={true}
      highlightOnHover
      records={data}
      columns={columns}
      onRowClick={({ record: { name, party, bornIn } }) => {
        console.log(record);
      }}
    />
  );
};

export { Table };
