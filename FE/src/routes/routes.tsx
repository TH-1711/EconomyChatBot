import React from "react";
import { createHashRouter, RouterProvider } from "react-router-dom";
import MainLayout from "../layout/mainLayout";
import ChatPage from "../pages/chatPage";
import HistoryPage from "../pages/historyPage";
import StatisticsPage from "../pages/statistics";
// import ErrorPage from "../pages/ErrorPage/ErrorPage";

const routes = [
  {
    path: "/Chat",
    element: (
      <MainLayout>
        <ChatPage />
      </MainLayout>
    ),
    //errorElement: <ErrorPage />,
  },
  {
    path: "/",
    element: (
      <MainLayout>
        <ChatPage />
      </MainLayout>
    ),
    //errorElement: <ErrorPage />,
  },
  {
    path: "/History",
    element: (
      <MainLayout>
        <HistoryPage />
      </MainLayout>
    ),
  },
  {
    path: "/Statistics",
    element: (
      <MainLayout>
        <StatisticsPage />
      </MainLayout>
    ),
  },
];

const router = createHashRouter(routes);

const Router: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default Router;
