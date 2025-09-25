import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Upload, Cpu, AlertTriangle, BarChart3, FileText, Users } from 'lucide-react';

const items = [
  { name: 'Dashboard', to: '/dashboard', icon: Home },
  { name: 'Uploads', to: '/uploads', icon: Upload },
  { name: 'Anomalies', to: '/anomalies', icon: AlertTriangle },
  { name: 'Marking', to: '/marking', icon: Cpu },
  { name: 'Results', to: '/results', icon: BarChart3 },
  { name: 'Schemes', to: '/schemes', icon: FileText },
  { name: 'Groups', to: '/groups', icon: Users },
];

export default function SideNav() {
  return (
    <nav className="h-full py-4 overflow-y-auto">
      <ul className="space-y-1 px-2">
        {items.map(({ name, to, icon: Icon }) => (
          <li key={name}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:text-indigo-700 hover:bg-gray-50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
