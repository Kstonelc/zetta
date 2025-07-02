import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import {
  MantineProvider,
  createTheme,
  Button,
  ColorSchemeScript,
} from "@mantine/core";
import routerConfig from "@/routers";
import { Notifications } from "@mantine/notifications";
import { RouterProvider } from "react-router-dom";

const theme = createTheme({
  fontFamily:
    "ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;",
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
    <>
      <ColorSchemeScript defaultColorScheme={"light"} />
      <MantineProvider theme={theme} defaultColorScheme={"light"}>
        <Notifications />
        <RouterProvider router={routerConfig} />
      </MantineProvider>
    </>
  );
}
