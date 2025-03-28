import React, { useState } from "react";
import { Layout } from "antd";
import SideBar from "../components/sidebar"; // Sidebar Component
import CustomHeader from "../components/header"; // Header Component

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout
      style={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      <CustomHeader collapsed={collapsed} setCollapsed={setCollapsed} />
      <Layout
        style={{
          display: "flex",
          flexDirection: "row",
          flex: 1,
          height: "100%",
        }}
      >
        <SideBar collapsed={collapsed} />
        <Content
          style={{
            padding: "0px",
            flex: 1,
            overflow: "auto",
            backgroundColor: "#EAF2F8",
            height: "85vh",
            width: "auto",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
