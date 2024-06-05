import { block } from "million/react";
import { CssBaseline } from "@mui/material";
import HomePage from "./pages/Home";

function App() {
  return (
    <CssBaseline>
      <div
        id="APP DIV"
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingTop: "25px",
          paddingBottom: "60px",
          paddingRight: "10px",
          paddingLeft: "10px",
          background: "#EEE",
        }}
      >
        <HomePage />
      </div>
    </CssBaseline>
  );
}

const AppBlock = /* @optimize */ block(App);
export default AppBlock;
