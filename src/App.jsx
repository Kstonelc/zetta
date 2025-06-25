import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import Routers from "./routers";

export default function App() {
  return (
    <MantineProvider>
      <Routers />
    </MantineProvider>
  );
}
