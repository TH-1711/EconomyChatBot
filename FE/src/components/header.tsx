import { Layout } from "antd";
import { motion } from "framer-motion";
import Logo from "./logo";
import Logo2 from "./logo2";

const { Header } = Layout;

interface HeaderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const CustomHeader: React.FC<HeaderProps> = ({ collapsed, setCollapsed }) => {
  return (
    <Header
      style={{
        backgroundColor: "#4A90E2",
        display: "flex",
        alignItems: "center",
        height: "15vh",
      }}
    >
      {/* Animated Logo */}
      <motion.div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
        animate={{ rotate: collapsed ? -360 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div
          style={{
            cursor: "pointer",
            marginLeft: "auto",
            color: "white",
          }}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <div
              style={{
                width: "10vh",
                height: "10vh",
                borderRadius: "50%", // Makes it a circle
                overflow: "hidden", // Ensures the logo stays within the circle
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "blue",
              }}
            >
              <div
                style={{
                  width: "8vh",
                  height: "8vh",

                  borderRadius: "50%", // Makes it a circle
                }}
              >
                <Logo2 />
              </div>
            </div>
          ) : (
            <div
              style={{
                width: "10vh",
                height: "10vh",
                borderRadius: "50%", // Makes it a circle
                overflow: "hidden", // Ensures the logo stays within the circle
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "blue",
              }}
            >
              <div
                style={{
                  width: "8vh",
                  height: "8vh",
                  backgroundColor: "white",
                  borderRadius: "50%", // Makes it a circle
                  overflow: "hidden", // Ensures the logo stays within the circle
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "6vh",
                    height: "6vh",
                    backgroundColor: "white",
                    borderRadius: "50%", // Makes it a circle
                  }}
                >
                  <Logo />
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Collapse button on the right */}
    </Header>
  );
};

export default CustomHeader;
