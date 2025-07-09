import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { MainLayout } from "../layouts";
import { WikiHome, Agent, WikiDetail, UserLogin } from "../pages";

const AuthGuard = ({ children }) => {
  const accessToken = false;
  if (!accessToken) {
    return <Navigate to="/user/login" replace />;
  }

  return <>{children}</>;
};

const Router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: "wiki",
        element: <WikiHome />,
        children: [
          {
            path: "detail",
            element: <WikiDetail />,
            children: [
              {
                path: ":id",
                element: <WikiDetail />,
              },
            ],
          },
        ],
      },
      {
        path: "agent",
        element: <Agent />,
      },
    ],
  },
  {
    path: "/user",
    children: [
      { index: true, element: <UserLogin /> },
      { path: "login", element: <UserLogin /> },
    ],
  },
]);

export default Router;
