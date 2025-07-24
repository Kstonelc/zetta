import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { MainLayout, WikiLayout } from "../layouts";
import {
  WikiHome,
  Agent,
  UserLogin,
  UserRegister,
  UserForgotPassword,
  WikiDetail,
  WikiAdd,
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
        index: true,
        element: <Navigate to="/wiki" replace />,
      },
      {
        path: "wiki",
        element: <WikiHome />,
      },
      {
        path: "wiki/add",
        element: <WikiAdd />,
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
      { path: "register", element: <UserRegister /> },
      { path: "reset-password", element: <UserForgotPassword /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default Router;
