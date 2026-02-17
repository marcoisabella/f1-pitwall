import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { LiveDashboard } from './pages/LiveDashboard';
import { Strategy } from './pages/Strategy';
import { Fantasy } from './pages/Fantasy';
import { Login } from './pages/Login';

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

            {/* Section C: Fantasy */}
            <Route path="/fantasy" element={<ProtectedRoute><Fantasy /></ProtectedRoute>} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
