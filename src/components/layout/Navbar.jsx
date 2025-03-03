 
// src/components/layout/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">Desenvolver Coworking</span>
            </Link>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <span>Olá, {user.name || user.email}</span>
              
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="px-3 py-2 rounded hover:bg-blue-700"
                >
                  Administração
                </Link>
              )}
              
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded hover:bg-blue-700"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar() {
  const { isAdmin } = useAuth();

  return (
    <aside className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <nav>
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `block px-4 py-2 rounded transition ${
                  isActive ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`
              }
            >
              Agendamentos
            </NavLink>
          </li>
          
          {isAdmin && (
            <>
              <li className="pt-2 pb-1">
                <span className="px-4 text-xs uppercase text-gray-400 font-semibold">
                  Administração
                </span>
              </li>
              
              <li>
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded transition ${
                      isActive ? 'bg-blue-600' : 'hover:bg-gray-700'
                    }`
                  }
                >
                  Usuários
                </NavLink>
              </li>
              
              <li>
                <NavLink
                  to="/admin/rooms"
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded transition ${
                      isActive ? 'bg-blue-600' : 'hover:bg-gray-700'
                    }`
                  }
                >
                  Salas
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
}

// src/components/layout/Layout.jsx
import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}

// src/pages/LoginPage.jsx
import React from 'react';
import Login from '../components/auth/Login';

export default function LoginPage() {
  return <Login />;
}

// src/pages/HomePage.jsx
import React from 'react';
import Layout from '../components/layout/Layout';
import BookingCalendar from '../components/booking/Calendar';

export default function HomePage() {
  return (
    <Layout>
      <BookingCalendar />
    </Layout>
  );
}

// src/pages/AdminPage.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import UserManagement from '../components/admin/UserManagement';
import RoomManagement from '../components/admin/RoomManagement';

export default function AdminPage() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/users" replace />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/rooms" element={<RoomManagement />} />
      </Routes>
    </Layout>
  );
}

// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth, RequireAdmin } from './utils/permissions';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route 
            path="/" 
            element={
              <RequireAuth>
                <HomePage />
              </RequireAuth>
            } 
          />
          
          <Route 
            path="/admin/*" 
            element={
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);