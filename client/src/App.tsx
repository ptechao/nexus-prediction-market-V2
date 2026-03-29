import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Navigation } from "./components/Navigation";
import Home from "./pages/Home";
import Markets from "./pages/Markets";
import MarketDetail from "./pages/MarketDetail";
import Leaderboard from "./pages/Leaderboard";
import VaultDetails from "./pages/VaultDetails";
import Portfolio from "./pages/Portfolio";
import Profile from "./pages/Profile";
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { web3Config } from "./lib/web3Config";
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

import AdminDashboard from "./pages/Admin/Dashboard";

function Router() {
  return (
    <Switch>
      {/* Admin Shell */}
      <Route path="/admin/:rest*">
        <Switch>
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/markets" component={AdminDashboard} />
          <Route path="/admin/users" component={AdminDashboard} />
          <Route path="/admin/reports" component={AdminDashboard} />
          <Route path="/admin/settings" component={AdminDashboard} />
          <Route component={() => <AdminDashboard />} />
        </Switch>
      </Route>

      {/* Main Marketplace Shell */}
      <Route>
        <div className="flex flex-col min-h-screen">
          <Navigation />
          <main className="flex-grow">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/markets" component={Markets} />
              <Route path="/markets/:id" component={MarketDetail} />
              <Route path="/leaderboard" component={Leaderboard} />
              <Route path="/vault/:id" component={VaultDetails} />
              <Route path="/portfolio" component={Portfolio} />
              <Route path="/profile" component={Profile} />
              <Route path="/404" component={NotFound} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </Route>
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <WagmiProvider config={web3Config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <LanguageProvider>
              <ThemeProvider
                defaultTheme="dark"
                // switchable
              >
                <TooltipProvider>
                  <Toaster />
                  <Router />
                </TooltipProvider>
              </ThemeProvider>
            </LanguageProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}

export default App;
