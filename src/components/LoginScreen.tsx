import React, { useState } from 'react';
import { Lock, User, LogIn, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (username: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (cleanUser === 'admin' && cleanPass === 'admin') {
      setError(null);
      onLoginSuccess(cleanUser);
    } else {
      setError('Username atau password salah. Gunakan default: admin / admin');
    }
  };

  return (
    <div className="w-screen h-screen bg-[#07090e] text-white flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Subtle Ambient Background Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm bg-zinc-900/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-6 sm:p-7 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-wider text-emerald-400 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sistem Monitoring Real-Time</span>
          </div>
          <h1 className="text-lg font-extrabold tracking-tight text-white">
            GRIYA INDAH SECAWAN
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Silakan masuk untuk mengakses Siteplan & Data Konsumen
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Username
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Masukkan username (admin)"
                autoComplete="username"
                autoFocus
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-950/90 border border-white/15 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-emerald-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Masukkan password (admin)"
                autoComplete="current-password"
                className="w-full h-10 pl-9 pr-9 rounded-xl bg-zinc-950/90 border border-white/15 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-emerald-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 text-zinc-500 hover:text-zinc-300 p-1"
                title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk ke Aplikasi</span>
          </button>
        </form>

        {/* Footer Info */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Akses Default:</span>
          <span className="font-mono text-zinc-400">
            user: <strong className="text-white">admin</strong> • pass:{' '}
            <strong className="text-white">admin</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
