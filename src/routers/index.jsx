import React from "react";
import { createBrowserRouter } from "react-router-dom";

import Layouts from "../layouts";
import { Wiki, Agent } from "../pages";

const Router = createBrowserRouter([
  {
    path: "/",
    element: <Layouts />,
    children: [
      {
        path: "/",
        element: <Wiki />,
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
