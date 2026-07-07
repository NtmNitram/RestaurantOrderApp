import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Pencil, KeyRound, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react'
import { getUsers, createUser, updateUser, setUserActive, resetUserPassword } from '../api/users'
import type { User, UserRole, CreateUserRequest, UpdateUserRequest, ResetPasswordRequest } from '../types'

const ROLES: UserRole[] = ['Administrador', 'Empleado', 'Cocina']

const ROLE_BADGE: Record<UserRole, string> = {
  Administrador: 'bg-orange-100 text-orange-700',
  Empleado:      'bg-blue-100 text-blue-700',
  Cocina:        'bg-gray-100 text-gray-600',
}

function backendMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? fallback
}

// ── Modal crear usuario ───────────────────────────────────────────────────────

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [role, setRole] = useState<UserRole>('Empleado')

  const mutation = useMutation({
    mutationFn: (req: CreateUserRequest) => createUser(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
  })

  const isValid = displayName.trim() && username.trim() && password.length >= 6

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    mutation.mutate({ displayName: displayName.trim(), username: username.trim(), password, role })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">Nuevo usuario</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
            <input
              autoFocus
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Ej. María López"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="Ej. mlopez"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password && password.length < 6 && (
              <p className="text-xs text-red-500 mt-1">Mínimo 6 caracteres</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol <span className="text-red-500">*</span></label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {mutation.isError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {backendMessage(mutation.error, 'Error al crear el usuario.')}
            </p>
          )}
          <button
            type="submit"
            disabled={!isValid || mutation.isPending}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
          >
            {mutation.isPending ? 'Creando...' : 'Crear usuario'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Modal editar usuario ──────────────────────────────────────────────────────

function EditUserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [displayName, setDisplayName] = useState(user.displayName)
  const [role, setRole] = useState<UserRole>(user.role)

  const mutation = useMutation({
    mutationFn: (req: UpdateUserRequest) => updateUser(user.id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
  })

  const isValid = displayName.trim() !== ''
  const hasChanges = displayName.trim() !== user.displayName || role !== user.role

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !hasChanges) return
    mutation.mutate({ displayName: displayName.trim(), role })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">Editar usuario</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
            <input
              autoFocus
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">El nombre de usuario no se puede cambiar.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol <span className="text-red-500">*</span></label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {mutation.isError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {backendMessage(mutation.error, 'Error al actualizar el usuario.')}
            </p>
          )}
          <button
            type="submit"
            disabled={!isValid || !hasChanges || mutation.isPending}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Modal resetear contraseña ─────────────────────────────────────────────────

function ResetPasswordModal({ user, onClose }: { user: User; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [done, setDone] = useState(false)

  const mutation = useMutation({
    mutationFn: (req: ResetPasswordRequest) => resetUserPassword(user.id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDone(true)
    },
  })

  const isValid = password.length >= 6

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    mutation.mutate({ newPassword: password })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">Resetear contraseña</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        {done ? (
          <div className="text-center py-4">
            <p className="text-green-600 font-medium mb-1">✓ Contraseña actualizada</p>
            <p className="text-sm text-gray-500 mb-4">
              La nueva contraseña de <strong>{user.displayName}</strong> quedó guardada.
            </p>
            <button onClick={onClose} className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors">
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
              Establecer nueva contraseña para <strong>{user.displayName}</strong> ({user.username}).
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  autoFocus
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && password.length < 6 && (
                <p className="text-xs text-red-500 mt-1">Mínimo 6 caracteres</p>
              )}
            </div>
            {mutation.isError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {backendMessage(mutation.error, 'Error al resetear la contraseña.')}
              </p>
            )}
            <button
              type="submit"
              disabled={!isValid || mutation.isPending}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
            >
              {mutation.isPending ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

type Modal = { type: 'create' } | { type: 'edit'; user: User } | { type: 'resetPwd'; user: User }

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<Modal | null>(null)
  const [confirmToggleId, setConfirmToggleId] = useState<number | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => setUserActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setConfirmToggleId(null)
      setToggleError(null)
    },
    onError: (err) => {
      setToggleError(backendMessage(err, 'No se puede cambiar el estado del usuario.'))
    },
  })

  if (isLoading) return <div className="flex items-center justify-center py-20 text-gray-400">Cargando usuarios...</div>
  if (isError) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">Error al cargar los usuarios.</div>

  const sorted = [...(users ?? [])].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
    return a.displayName.localeCompare(b.displayName, 'es')
  })

  const closeModal = () => setModal(null)

  return (
    <div>
      {modal?.type === 'create' && <CreateUserModal onClose={closeModal} />}
      {modal?.type === 'edit' && <EditUserModal user={modal.user} onClose={closeModal} />}
      {modal?.type === 'resetPwd' && <ResetPasswordModal user={modal.user} onClose={closeModal} />}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {sorted.filter(u => u.isActive).length} activos · {sorted.filter(u => !u.isActive).length} inactivos
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-1.5 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      <div className="grid gap-3">
        {sorted.map(user => (
          <div
            key={user.id}
            className={`bg-white rounded-xl border p-4 transition-opacity ${!user.isActive ? 'opacity-60 border-gray-200' : 'border-gray-200'}`}
          >
            {confirmToggleId === user.id ? (
              <div>
                <p className="text-sm text-gray-700 font-medium mb-1">
                  ¿Desactivar a <span className="text-red-600">{user.displayName}</span>?
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  No podrá iniciar sesión hasta que lo reactives.
                </p>
                {toggleError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 mb-3">
                    {toggleError}
                  </p>
                )}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setConfirmToggleId(null); setToggleError(null) }}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => toggleMutation.mutate({ id: user.id, active: false })}
                    disabled={toggleMutation.isPending}
                    className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-40 transition-colors"
                  >
                    {toggleMutation.isPending ? 'Desactivando...' : 'Sí, desactivar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <p className="font-semibold text-gray-800 truncate min-w-0">{user.displayName}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${ROLE_BADGE[user.role]}`}>
                      {user.role}
                    </span>
                    {!user.isActive && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">@{user.username}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setModal({ type: 'resetPwd', user })}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    title="Resetear contraseña"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setModal({ type: 'edit', user })}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    title="Editar usuario"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (user.isActive) {
                        setConfirmToggleId(user.id)
                        setToggleError(null)
                      } else {
                        toggleMutation.mutate({ id: user.id, active: true })
                      }
                    }}
                    disabled={toggleMutation.isPending && toggleMutation.variables?.id === user.id}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-40"
                    title={user.isActive ? 'Desactivar' : 'Reactivar'}
                  >
                    {user.isActive
                      ? <ToggleRight className="w-5 h-5 text-orange-500" />
                      : <ToggleLeft className="w-5 h-5" />
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
