import React, { useState } from 'react';
import {
  Activity,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UserRound,
} from 'lucide-react';

export const AuthScreen = ({ onLogin, onRegister, loading }) => {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      if (mode === 'register') {
        await onRegister({ name: name.trim(), email: email.trim(), password });
      } else {
        await onLogin({ email: email.trim(), password });
      }
    } catch (err) {
      setError(err.message || 'No fue posible autenticar');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] rounded-2xl border border-slate-800/70 bg-slate-900/80 shadow-2xl overflow-hidden">
        <aside className="hidden lg:flex flex-col justify-between p-7 border-r border-slate-800/70 bg-linear-to-b from-slate-900 to-slate-950/80">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Acceso Seguro
            </div>
            <h2 className="text-3xl font-bold text-slate-100 mt-4 leading-tight">Bienvenido a NetPulse Sentinel</h2>
            <p className="text-slate-400 mt-3 text-sm">
              Controla servicios, revisa eventos y mantén visibilidad completa de tu infraestructura.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl bg-slate-950/60 border border-slate-800/70 p-3 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 mt-0.5 text-emerald-400" />
              <p className="text-sm text-slate-300">Sesiones protegidas con token JWT y credenciales cifradas.</p>
            </div>
            <div className="rounded-xl bg-slate-950/60 border border-slate-800/70 p-3 flex items-start gap-2">
              <Activity className="w-4 h-4 mt-0.5 text-cyan-400" />
              <p className="text-sm text-slate-300">Monitorea HTTP, PING y puertos desde un panel unificado.</p>
            </div>
          </div>
        </aside>

        <div className="p-6 lg:p-7">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              {mode === 'login' ? (
                <LogIn className="w-4.5 h-4.5 text-emerald-400" />
              ) : (
                <UserPlus className="w-4.5 h-4.5 text-emerald-400" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-100">{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {mode === 'login' ? 'Ingresa para acceder al panel de monitoreo.' : 'Regístrate y empieza a gestionar tus objetivos.'}
          </p>

          <div className="mt-4 flex rounded-lg bg-slate-950/80 p-1 border border-slate-800/70">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'login' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'register' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Registro
            </button>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-3">
            {mode === 'register' && (
              <label className="block">
                <span className="text-sm text-slate-400">Nombre</span>
                <div className="mt-1 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 focus-within:border-emerald-500/70 transition-colors">
                  <UserRound className="w-4 h-4 text-slate-500" />
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent outline-none text-slate-100"
                    placeholder="Tu nombre"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="text-sm text-slate-400">Email</span>
              <div className="mt-1 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 focus-within:border-emerald-500/70 transition-colors">
                <Mail className="w-4 h-4 text-slate-500" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none text-slate-100"
                  placeholder="correo@dominio.com"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm text-slate-400">Contraseña</span>
              <div className="mt-1 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 focus-within:border-emerald-500/70 transition-colors">
                <Lock className="w-4 h-4 text-slate-500" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-slate-100"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-slate-500 hover:text-slate-300"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            {error && <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-70 text-white font-medium transition-colors"
            >
              {loading ? 'Procesando...' : mode === 'login' ? 'Entrar al panel' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
