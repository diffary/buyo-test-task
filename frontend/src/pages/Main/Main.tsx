import {
  Box,
  Typography
} from "@mui/material";

const Main = () => {
  return (
    <Box id="portal-root">
      <Box my={2} display="flex">
        <Typography variant="h5" fontWeight={600}>Добро пожаловать!</Typography>
      </Box>
    </Box>
  );
};

export default Main;
