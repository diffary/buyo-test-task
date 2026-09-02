import { useEffect } from "react";
import {useAppDispatch, useAppSelector} from "./utils/store/hooks.ts";
import {checkUser} from "./utils/API/authAPI.ts";
import App from "./App.tsx";
import CircularProgress from "@mui/material/CircularProgress";
import {Box} from "@mui/material";

const AppWrapper = () => {
  const dispatch = useAppDispatch();
  const { initialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkUser());

    const APP_VERSION = "1.0.4";
    const VERSION_KEY = "app_version";
    const savedVersion = localStorage.getItem(VERSION_KEY);

    if (savedVersion !== APP_VERSION) {
      localStorage.clear();
      localStorage.setItem(VERSION_KEY, APP_VERSION);
    }
  }, []);


  if (!initialized) {
    return <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
      }}
    >
      <CircularProgress />
    </Box>;
  }

  return <App />;
};

export default AppWrapper;
