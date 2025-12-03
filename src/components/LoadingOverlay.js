import React from "react";
import { CircularProgress, Box, Typography } from "@mui/material";

export default function LoadingOverlay({ text }) {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 3,
      }}
    >
      <CircularProgress size={60} sx={{ color: "white" }} />

      <Typography
        variant="h6"
        sx={{ color: "white", textAlign: "center", fontWeight: "500" }}
      >
        {text}
      </Typography>
    </Box>
  );
}
