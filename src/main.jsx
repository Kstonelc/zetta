import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// 导入 mantine datatable 样式
import "@mantine/core/styles.css";
import "mantine-datatable/styles.css";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
