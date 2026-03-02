import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Home } from './pages/Home';
import { Schedule } from './pages/Schedule';
import { Teams } from './pages/Teams';
import { TeamDetail } from './pages/TeamDetail';
import { Drivers } from './pages/Drivers';
import { DriverDetail } from './pages/DriverDetail';
import { Standings } from './pages/Standings';
import { Regulations } from './pages/Regulations';
import { Conditions } from './pages/Conditions';
import { LiveDashboard } from './pages/LiveDashboard';
import { Strategy } from './pages/Strategy';
import { Fantasy } from './pages/Fantasy';
import { Login } from './pages/Login';
import { FantasyLayout } from './components/fantasy/FantasyLayout';
import { TeamCalculator } from './pages/fantasy/TeamCalculator';
import { BudgetBuilder } from './pages/fantasy/BudgetBuilder';
import { LiveScoring } from './pages/fantasy/LiveScoring';
import { SeasonSummary } from './pages/fantasy/SeasonSummary';
import { EliteData } from './pages/fantasy/EliteData';
import { Statistics } from './pages/fantasy/Statistics';
import { TeamAnalyzer } from './pages/fantasy/TeamAnalyzer';
import { LeagueView } from './pages/fantasy/LeagueView';
import { Hindsight } from './pages/fantasy/Hindsight';
import { DRSBoost } from './pages/fantasy/DRSBoost';
import { ChipStrategy } from './pages/fantasy/ChipStrategy';
import { Settings } from './pages/fantasy/Settings';
import { ImportTeam } from './pages/fantasy/ImportTeam';
import { EnterTeam } from './pages/fantasy/EnterTeam';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Section A: F1 Info Hub */}
            <Route path="/" element={<Home />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/:teamId" element={<TeamDetail />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/drivers/:driverId" element={<DriverDetail />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/regulations" element={<Regulations />} />

            {/* Section B: Live Analytics */}
            <Route path="/live" element={<LiveDashboard />} />
            <Route path="/strategy" element={<Strategy />} />
            <Route path="/conditions" element={<Conditions />} />

            {/* Section C: Fantasy Toolkit */}
            <Route path="/fantasy" element={<FantasyLayout />}>
              <Route index element={<Navigate to="/fantasy/calculator" replace />} />
              <Route path="calculator" element={<TeamCalculator />} />
              <Route path="budget" element={<BudgetBuilder />} />
              <Route path="live" element={<LiveScoring />} />
              <Route path="enter-team" element={<EnterTeam />} />
              <Route path="season" element={<SeasonSummary />} />
              <Route path="elite" element={<EliteData />} />
              <Route path="stats" element={<Statistics />} />
              <Route path="analyzer" element={<TeamAnalyzer />} />
              <Route path="league" element={<ProtectedRoute><LeagueView /></ProtectedRoute>} />
              <Route path="hindsight" element={<Hindsight />} />
              <Route path="drs" element={<DRSBoost />} />
              <Route path="chips" element={<ChipStrategy />} />
              <Route path="import" element={<ProtectedRoute><ImportTeam /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            </Route>

            {/* Legacy fantasy route */}
            <Route path="/fantasy-classic" element={<ProtectedRoute><Fantasy /></ProtectedRoute>} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
