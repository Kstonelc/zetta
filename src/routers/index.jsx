import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { MainLayout, WikiLayout } from "../layouts";
import {
  WikiHome,
  Agent,
  UserLogin,
  WikiDetail,
  WikiDetailEdit,
  NotFound,
} from "../pages";

const AuthGuard = ({ children }) => {
  const accessToken = "1234566";
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
      },
      {
        path: "wiki",
        element: <WikiLayout />,
        children: [
          {
            path: ":wikiId/docs",
            element: <WikiDetail />,
          },
          {
            path: "detail/edit",
            element: <WikiDetailEdit />,
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
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default Router;
