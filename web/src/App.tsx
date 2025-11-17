import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Campsites from './pages/Campsites';
import CampsiteDetail from './pages/CampsiteDetail';
import MyReservations from './pages/MyReservations';
import Favorites from './pages/Favorites';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />

      <Route element={<Layout />}>
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/products"
          element={isAuthenticated ? <Products /> : <Navigate to="/login" />}
        />
        <Route
          path="/orders"
          element={isAuthenticated ? <Orders /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={isAuthenticated ? <Profile /> : <Navigate to="/login" />}
        />
        <Route
          path="/campsites"
          element={isAuthenticated ? <Campsites /> : <Navigate to="/login" />}
        />
        <Route
          path="/campsites/:id"
          element={isAuthenticated ? <CampsiteDetail /> : <Navigate to="/login" />}
        />
        <Route
          path="/my-reservations"
          element={isAuthenticated ? <MyReservations /> : <Navigate to="/login" />}
        />
        <Route
          path="/favorites"
          element={isAuthenticated ? <Favorites /> : <Navigate to="/login" />}
        />
      </Route>

      <Route path="/" element={<Navigate to="/campsites" />} />
    </Routes>
  );
}

export default App;
