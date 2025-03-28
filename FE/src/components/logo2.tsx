import logo from "../assets/Logo_loadscreen.svg"; // Import ảnh

const Logo2 = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "100%",
      }}
    >
      <img
        src={logo}
        alt="logo"
        style={{ height: "100%", width: "100%", objectFit: "contain" }}
      />
    </div>
  );
};

export default Logo2;
