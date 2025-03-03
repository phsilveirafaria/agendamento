 
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