import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
        <span className="mr-4 text-lg font-bold text-indigo-600">Gestor de Tareas</span>
        <nav className="flex flex-wrap gap-1">
          <NavLink to="/tasks" className={linkClass}>
            Tareas
          </NavLink>
          <NavLink to="/reports" className={linkClass}>
            Reportes
          </NavLink>
          {isAdmin && (
            <NavLink to="/maintenance" className={linkClass}>
              Mantenimiento
            </NavLink>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">
            {user?.email}
            {isAdmin && <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-semibold text-indigo-700">ADMIN</span>}
          </span>
          <button onClick={handleLogout} className="btn-secondary">
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  )
}
