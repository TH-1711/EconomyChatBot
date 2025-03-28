import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import {
  MessageOutlined,
  HistoryOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Sider } = Layout;

const Sider_items: MenuProps["items"] = [
  {
    key: "Chat",
    icon: <MessageOutlined />,
    label: "Chat",
    style: { marginBottom: "2vh" }, // Thêm khoảng cách
  },
  {
    key: "History",
    icon: <HistoryOutlined />,
    label: "History",
    style: { marginBottom: "2vh" },
  },
  {
    key: "Statistics",
    icon: <BarChartOutlined />,
    label: "Statistics",
    style: { marginBottom: "2vh" },
  },
];

interface SideBarProps {
  collapsed: boolean;
}

const SideBar: React.FC<SideBarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const handleMenuClick: MenuProps["onClick"] = (e) => {
    navigate(`/${e.key}`);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={collapsed ? "2vw" : "13vw"}
      style={{
        backgroundColor: "#C5D8EB",
        transition: "all 0.3s ease",
        color: "#2F3A45",
        height: "100%",
      }}
    >
      <Menu
        theme="light"
        mode="vertical"
        items={Sider_items}
        style={{
          width: "100%",
          marginTop: "5vh",
          backgroundColor: "	#C5D8EB",
          color: "#2F3A45",
          gap: "5vh",
        }}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default SideBar;
