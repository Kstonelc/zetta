import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
// import tiptap styles after core package styles
import "@mantine/tiptap/styles.css";

import {
  MantineProvider,
  createTheme,
  Button,
  ColorSchemeScript,
} from "@mantine/core";
import routerConfig from "@/routers";
import { Notifications } from "@mantine/notifications";
import { RouterProvider } from "react-router-dom";
import { ColorScheme } from "@/enum";

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
      <ColorSchemeScript defaultColorScheme={ColorScheme.light} />
      <MantineProvider theme={theme} defaultColorScheme={ColorScheme.light}>
        <Notifications />
        <RouterProvider router={routerConfig} />
      </MantineProvider>
    </>
  );
}
