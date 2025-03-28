import Logo2 from "./logo2";
const ResponseLogo = () => {
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
        backgroundColor: "blue",
      }}
    >
      <div
        style={{
          width: "3.5vh",
          height: "3.5vh",

          borderRadius: "50%", // Makes it a circle
        }}
      >
        <Logo2 />
      </div>
    </div>
  );
};
export default ResponseLogo;
