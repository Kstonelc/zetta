import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { MainLayout } from "../layouts";
import { Wiki, Agent } from "../pages";

const Router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/wiki" replace />,
      },
      {
        path: "wiki",
        element: <Wiki />,
      },
      {
        path: "agent",
        element: <Agent />,
      },
    ],
  },
]);

export default Router;
