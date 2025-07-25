import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
// import tiptap styles after core package styles
import "@mantine/tiptap/styles.css";
import "@mantine/dropzone/styles.css";

import {
  MantineProvider,
  createTheme,
  Button,
  ColorSchemeScript,
  TextInput,
  NumberInput,
  Textarea,
  Stack,
  Select,
  Card,
  Switch,
  ScrollArea,
} from "@mantine/core";
import routerConfig from "@/routers";
import { Notifications } from "@mantine/notifications";
import "./i18n";
import { RouterProvider } from "react-router-dom";
import { ColorScheme } from "@/enum";

const theme = createTheme({
  fontFamily:
    'HarmonyOS Sans", "Segoe UI", "SF Pro Display", -apple-system, BlinkMacSystemFont, Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif, "HarmonyOS Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft Yahei UI", "Microsoft Yahei", "Source Han Sans CN", sans-serif, "Segoe UI Emoji", "Segoe UI Symbol", "Apple Color Emoji", "Twemoji Mozilla", "Noto Color Emoji", "Android Emoji',
  components: {
    Stack: Stack.extend({
      defaultProps: {
        mih: 0,
      },
    }),
    Button: Button.extend({
      defaultProps: {
        radius: "md",
      },
    }),
    TextInput: TextInput.extend({
      defaultProps: {
        radius: "md",
        variant: "filled",
        autoComplete: "new-password",
      },
    }),
    NumberInput: NumberInput.extend({
      defaultProps: {
        radius: "md",
        variant: "filled",
      },
    }),
    Textarea: Textarea.extend({
      defaultProps: {
        radius: "md",
        variant: "filled",
        autosize: true,
        minRows: 3,
      },
    }),
    Select: Select.extend({
      defaultProps: {
        radius: "md",
        variant: "filled",
      },
    }),
    Switch: Switch.extend({
      defaultProps: {
        size: "sm",
        radius: "md",
        withThumbIndicator: false,
      },
    }),
    Card: Card.extend({
      defaultProps: {
        shadow: "sm",
        radius: "md",
      },
    }),
    ScrollArea: ScrollArea.extend({
      defaultProps: {
        offsetScrollbars: true,
        type: "never",
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
