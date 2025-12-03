import React from "react";
import { Box, Card, CardContent, Typography, Grid, Button } from "@mui/material";
import qr from "../assets/qr.jpg";

export default function Support() {
  return (
<Grid 
  container 
  spacing={4} 
  mb={6} 
  alignItems="flex-start"
>
  {/* LEFT SIDE — Cost Breakdown */}
  <Grid item xs={12} md={7}>
    <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3 , width: 700,
          height: 500,}}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Where Your Contribution Goes 🔧
      </Typography>

      <Box mb={3}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          Server Hosting Costs
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Real-time auctions, smooth connections, and uptime depend on paid cloud servers.
        </Typography>
      </Box>

      <Box mb={3}>
        <Typography variant="h6" fontWeight="bold" color="secondary">
          Database Storage
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Player lists, team data, chats, and auction states are stored in a paid database.
        </Typography>
      </Box>

      <Box mb={3}>
        <Typography variant="h6" fontWeight="bold" color="success.main">
          Maintenance & Updates
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Bug fixes, feature updates, UI improvements, and security patches.
        </Typography>
      </Box>

      <Box>
        <Typography variant="h6" fontWeight="bold" color="info.main">
          Future Upgrades
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Improvements to simulations, better user experience, and new features.
        </Typography>
      </Box>
        <Box>
        <Typography variant="body2" color="text.secondary" mt={4} fontWeight="bold">
             This platform is completely self-funded.  
            Your support helps cover the real costs of servers, database storage,
            maintenance and future updates.
        </Typography>
        </Box>
    </Card>
  </Grid>

  {/* RIGHT SIDE — QR CODE */}
  <Grid item xs={12} md={5}>
    <Card 
      sx={{
        borderRadius: 3,
        boxShadow: 4,
        padding: 3,
        position: "sticky",
        top: "80px"   // stays visible
      }}
    >
      <Typography 
        variant="h6" 
        textAlign="center" 
        fontWeight="bold" 
        mb={1}
      >
        Support via QR Code 🙌
      </Typography>

      <Typography 
        variant="body2" 
        color="text.secondary" 
        textAlign="center"
        mb={3}
      >
        Every small contribution helps keep the project running.
      </Typography>

      <Box 
        component="img"
        src={qr}
        alt="Support QR"
        sx={{
          width: 400,
          height: 400,
          borderRadius: 2,
          mx: "auto",
          display: "block",
          boxShadow: 3,
          mb: 3
        }}
      />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{
          borderRadius: 3,
          py: 1.5,
        }}
        href="upi://pay?pa=YOUR_UPI_ID"
      >
        Support via UPI
      </Button>
    </Card>
  </Grid>
</Grid>

  );
}
