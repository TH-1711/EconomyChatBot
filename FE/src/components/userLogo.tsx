import user from "../assets/User_avatar.svg"; // Import ảnh

const UserAvatar = () => {
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
        src={user}
        alt="logo"
        style={{ height: "100%", width: "100%", objectFit: "contain" }}
      />
    </div>
  );
};

const UserLogo = () => {
  return (
    <div
      style={{
        width: "5vh",
        height: "5vh",
        borderRadius: "50%", // Makes it a circle
        overflow: "hidden", // Ensures the logo stays within the circle
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#CACACA",
      }}
    >
      <div
        style={{
          width: "3.5vh",
          height: "3.5vh",

          borderRadius: "50%", // Makes it a circle
        }}
      >
        <UserAvatar />
      </div>
    </div>
  );
};

export default UserLogo;
