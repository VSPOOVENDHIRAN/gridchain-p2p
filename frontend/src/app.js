import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";
import History from "./pages/history";
import TradePage from "./pages/trade";
import GovtLedger from "./pages/govtledger.jsx";
import GovLogin from "./pages/govlogin";
import AnimatedBackground from "./components/AnimatedBackgroundPure";
import WelcomeHeader from "./components/WelcomeHeader";

function App() {
  return (
    <BrowserRouter>
      <AnimatedBackground />
      <WelcomeHeader />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/gov-login" element={<GovLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<History />} />
        <Route path="/trade" element={<TradePage />} />
        <Route path="/govtledger" element={<GovtLedger />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
