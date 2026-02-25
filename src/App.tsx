import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import FixProfile from './pages/FixProfile';
import EventDetails from './pages/EventDetails';
import AdminDashboard from './pages/admin/Dashboard';
import CollegeDashboard from './pages/college/Dashboard';
import Scanner from './pages/college/Scanner';
import MyBookings from './pages/student/MyBookings';
import Leaderboard from './pages/student/Leaderboard';
import LikedEvents from './pages/LikedEvents';
import ProfileSetup from './pages/ProfileSetup';
import UserProfile from './pages/UserProfile';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <LocationProvider>
          <Toaster position="top-center" />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/fix-profile" element={<FixProfile />} />
            <Route path="/event/:id" element={<EventDetails />} />
            <Route path="/wishlist" element={<LikedEvents />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/profile" element={<UserProfile />} />

            {/* Protected Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected College Routes */}
            <Route
              path="/college/*"
              element={
                <ProtectedRoute allowedRoles={['college']}>
                  <Routes>
                    <Route path="/" element={<CollegeDashboard />} />
                    <Route path="/scanner" element={<Scanner />} />
                  </Routes>
                </ProtectedRoute>
              }
            />

            {/* Protected Student Routes */}
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MyBookings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute allowedRoles={['student', 'college', 'admin']}>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </LocationProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
