import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { MainLayout, WikiLayout } from "../layouts";
import {
  WikiHome,
  Chat,
  UserLogin,
  UserRegister,
  UserForgotPassword,
  WikiDetail,
  WikiCreate,
  WikiDetailEdit,
  NotFound,
  UserActivate,
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
        path: "wiki/create",
        element: <WikiCreate />,
      },
      {
        path: "wiki/detail",
        element: <WikiLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="docs" replace />,
          },
          {
            path: "docs",
            element: <WikiDetail />,
          },
          {
            path: "settings",
            element: <WikiDetailEdit />,
          },
        ],
      },
      {
        path: "agent",
        element: <Chat />,
      },
    ],
  },
  {
    path: "/user",
    children: [
      { index: true, element: <UserLogin /> },
      { path: "login", element: <UserLogin /> },
      { path: "register", element: <UserRegister /> },
      { path: "activate", element: <UserActivate /> },
      { path: "reset-password", element: <UserForgotPassword /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default Router;
