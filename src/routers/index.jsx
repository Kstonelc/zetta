import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { MainLayout } from "../layouts";
import { WikiHome, Agent, WikiDetailEdit } from "../pages";

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
        element: <WikiHome />,
      },
      {
        path: "agent",
        element: <Agent />,
      },
      {
        path: "wiki/detail/:id",
        element: <WikiDetailEdit />,
      },
    ],
  },
]);

export default Router;
