// frontend/src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Portfolio from "./components/Portfolio";
import TradeHistory from "./components/TradeHistory";
import AILab from "./components/AILab";
import Backtesting from "./components/Backtesting";
import Alerts from "./components/Alerts";
import LivePNL from "./components/LivePNL";
import Casino from "./components/Casino";
import CongressTracker from "./components/CongressTracker";
import WhaleScanner from "./components/WhaleScanner";
import PredictionMarkets from "./components/PredictionMarkets";
import OpenBB from "./components/OpenBB";
import Settings from "./components/Settings";
import Strategies from "./components/Strategies";
import UserMenu from "./components/UserMenu";
import { ThemeProvider, useTheme } from "./theme/ThemeContext";
import GlobeIntel from "./pages/GlobeIntel";
import WOIBrain from "./pages/WOIBrain";
import ShadowTrading from "./pages/ShadowTrading";
import RiskCenter from "./pages/RiskCenter";
import WOIConsole from "./pages/WOIConsole";
import WOICommandCenter from "./pages/WOICommandCenter";
import SituationRoom from "./pages/SituationRoom";
import WorldPulse from "./pages/WorldPulse";
import GlobalOps from "./pages/GlobalOps";
import OpsRouterBoard from "./pages/OpsRouterBoard";
import AgentsLab from "./pages/AgentsLab";
import AlertSettings from "./pages/AlertSettings";
import IngestionDesk from "./pages/IngestionDesk";
import Watchlists from "./pages/Watchlists";
import ChartIntel from "./pages/ChartIntel";
import ExecutionCenter from "./pages/ExecutionCenter";
import LearningLab from "./pages/LearningLab";
import AlertCenterPage from "./pages/AlertCenterPage";
import DesktopControl from "./pages/DesktopControl";
import TopModuleBar from "./components/desktop/TopModuleBar";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "portfolio", label: "Portfolio", icon: "💼" },
  { id: "history", label: "Trade History", icon: "📜" },
  { id: "ai-lab", label: "AI Trainer", icon: "🧪" },
  { id: "backtest", label: "Backtesting", icon: "⏪" },
  { id: "alerts", label: "Alerts", icon: "🚨" },
  { id: "livepnl", label: "Live PnL", icon: "💹" },
  { id: "polymarket", label: "Polymarket", icon: "🗳️" },
  { id: "whales", label: "Whales", icon: "🐳" },
  { id: "congress", label: "Congress", icon: "🏛️" },
  { id: "openbb", label: "OpenBB", icon: "🧰" },
  { id: "casino", label: "Casino", icon: "🎰" },
  { id: "strategies", label: "Strategies", icon: "🧠" },
  { id: "settings", label: "Settings", icon: "⚙️" },
  { id: "globe-intel", label: "Globe Intel", icon: "🌍" },
{ id: "brain", label: "WOI Brain", icon: "🧠" },
{ id: "shadow", label: "Shadow", icon: "👻" },
{ id: "risk", label: "Risk", icon: "🛡️" },
{ id: "woi-console", label: "WOI Console", icon: "🗣️" },
{ id: "woi-command-center", label: "Command Center", icon: "🗣️" },
{ id: "situation-room", label: "Situation Room", icon: "🌍" },
{ id: "world-pulse", label: "World Pulse", icon: "🌐" },
{ id: "global-ops", label: "Global Ops", icon: "🌍" },
{ id: "ops-router", label: "Ops Router", icon: "🧭" },
{ id: "agents-lab", label: "Agents Lab", icon: "🤖" },
{ id: "alert-settings", label: "Alert Settings", icon: "🔔" },
{ id: "ingestion-desk", label: "Ingestion", icon: "🛰️" },
{ id: "watchlists", label: "Watchlists", icon: "👀" },
{ id: "chart-intel", label: "Chart Intel", icon: "📊" },
{ id: "execution-center", label: "Execution", icon: "💸" },
{ id: "learning-lab", label: "Learning", icon: "🧠" },
{ id: "alert-center", label: "Alert Center", icon: "🔔" },
{ id: "desktop-control", label: "Desktop", icon: "🖥️" },
];

function AppShell() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("woi_active_tab") || "dashboard");

  // persist active tab
  useEffect(() => {
    localStorage.setItem("woi_active_tab", activeTab);
  }, [activeTab]);

  const render = useMemo(() => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "portfolio":
        return <Portfolio />;
      case "history":
        return <TradeHistory />;
      case "ai-lab":
        return <AILab />;
      case "backtest":
        return <Backtesting />;
      case "alerts":
        return <Alerts />;
      case "livepnl":
        return <LivePNL />;
      case "polymarket":
        return <PredictionMarkets />;
      case "whales":
        return <WhaleScanner />;
      case "congress":
        return <CongressTracker />;
      case "openbb":
        return <OpenBB />;
      case "casino":
        return <Casino />;
      case "strategies":
      return <Strategies />;
    case "settings":
      return <Settings />;
    default:
        return <Dashboard />;
		case "globe-intel":
  return <GlobeIntel />;
case "brain":
  return <WOIBrain />;
case "shadow":
  return <ShadowTrading />;
case "risk":
  return <RiskCenter />;
  case "woi-console":
  return <WOIConsole />;
  case "woi-command-center":
  return <WOICommandCenter />;
  case "situation-room":
  return <SituationRoom />;
case "world-pulse":
  return <WorldPulse />;
  case "global-ops":
  return <GlobalOps />;
case "ops-router":
  return <OpsRouterBoard />;
  case "agents-lab":
  return <AgentsLab />;
case "alert-settings":
  return <AlertSettings />;
  case "ingestion-desk":
  return <IngestionDesk />;
  case "watchlists":
  return <Watchlists />;
case "chart-intel":
  return <ChartIntel />;
  case "execution-center":
  return <ExecutionCenter />;
case "learning-lab":
  return <LearningLab />;
  case "alert-center":
  return <AlertCenterPage />;
case "desktop-control":
  return <DesktopControl />;
    }
  }, [activeTab]);

  return (
    <div className="app-root">
      <Sidebar tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="app-main">
        <div className="app-topbar">
          <div className="appTitle">
            <div className="brand">WOI&apos;s Assistant</div>
            <div className="subtitle">AI Trading Suite</div>
          </div>
          <div style={{ flex: 1 }} />
          <UserMenu />
        </div>

        <div className="app-content">{render}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
