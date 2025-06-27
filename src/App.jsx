import "@mantine/core/styles.css";

import { MantineProvider, createTheme, Button } from "@mantine/core";
import routerConfig from "@/routers";
import { RouterProvider } from "react-router-dom";

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
    <MantineProvider theme={theme} defaultColorScheme="light">
      <RouterProvider router={routerConfig}></RouterProvider>;
    </MantineProvider>
  );
}
