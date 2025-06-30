import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { MantineProvider, createTheme, Button } from "@mantine/core";
import routerConfig from "@/routers";
import { Notifications } from "@mantine/notifications";
import { RouterProvider } from "react-router-dom";

const theme = createTheme({
  components: {
    Button: Button.extend({
      defaultProps: {
        radius: "md",
      },
    }),
  },
});

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications />
      <RouterProvider router={routerConfig} />
    </MantineProvider>
  );
}
