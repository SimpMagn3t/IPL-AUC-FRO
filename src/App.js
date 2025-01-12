import React from 'react';
import AuctionRoom from './components/AuctionRoom';
import JoinRoom from './components/JoinRoom';  // Import JoinRoom with correct casing
import HostJoin from './components/HostJoin';
import HostAucRoom from './components/HostAucRoom';
import CreateRoom from './components/CreateRoom';
import Navbar from './components/Navbar';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import TestEx from "./TestEx";
import JoinIssue from './components/JoinIssue';
import ReportIssue from './components/ReportIssue';
import { Analytics } from "@vercel/analytics/react"

function App() {
  const location = useLocation();

  // Define routes where the Navbar should not be shown
  const hideNavbarRoutes = ['/hostauc/:roomCode/:hostJoinCode', '/auction/:roomCode/:teamCode'];

  // Check if the current route matches any of the routes to hide the Navbar
  const shouldShowNavbar = !hideNavbarRoutes.some((route) =>
    new RegExp(`^${route.replace(/:\w+/g, '[^/]+')}$`).test(location.pathname)
  );

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <Routes>
        <Route path='/create' element={<CreateRoom />} />
        <Route path='/' element={<JoinRoom />} />
        <Route path='/host' element={<HostJoin />} />
        <Route path='/joinissue' element={<JoinIssue />} />
        <Route path='/hostauc/:roomCode/:hostJoinCode' element={<HostAucRoom />} />
        <Route path='/auction/:roomCode/:teamCode' element={<AuctionRoom />} />
        <Route path='/report' element={<ReportIssue/>} />
        <Analytics />
      </Routes>
    </>
  );
}

export default function RootApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}

