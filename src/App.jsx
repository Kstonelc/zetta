import "@mantine/core/styles.css";

import { MantineProvider, createTheme, Button } from "@mantine/core";
import Routers from "./routers";

const theme = createTheme({
  components: {
    Button: Button.extend({
      defaultProps: {
        radius: "lg",
      },
    }),
  },
});

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <Routers />
    </MantineProvider>
  );
}
