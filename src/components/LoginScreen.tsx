import React, { useState } from 'react';
import { Lock, User, LogIn, Eye, EyeOff } from 'lucide-react';

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
      setError('Username atau password salah (gunakan: admin / admin)');
    }
  };

  return (
    <div className="w-screen h-screen bg-[#031815] text-white flex items-center justify-center relative overflow-hidden select-none">
      {/* Ambient Desktop Backdrop (visible on wider/landscape screens behind the portrait stage) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src="/assets/aistudio/background_bawah_GIS_4K_ee3afe5f.jpg"
          alt=""
          className="w-full h-full object-cover opacity-50 blur-xl scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#031815]/50 to-[#031815]/80" />
      </div>

      {/* Main Portrait Stage matching the 1072×2368 Reference Design */}
      <div className="relative w-full h-full sm:w-auto sm:h-full sm:aspect-[1072/2368] max-w-full overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.85)] bg-[#041e1b]">
        {/* Layer 1: Full Emerald Islamic Pattern & Tropical Leaves Background */}
        <img
          src="/assets/aistudio/background_bawah_GIS_4K_ee3afe5f.jpg"
          alt="Background Griya Indah Secawan"
          className="absolute inset-0 w-full h-full object-cover object-bottom pointer-events-none"
          draggable={false}
        />

        {/* Layer 2: Top Twilight Housing Photo with Smooth Bottom Feathering */}
        <div
          className="absolute top-0 left-0 right-0 h-[43%] pointer-events-none overflow-hidden"
          style={{
            WebkitMaskImage:
              'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 66%, rgba(0,0,0,0.45) 84%, rgba(0,0,0,0) 100%)',
            maskImage:
              'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 66%, rgba(0,0,0,0.45) 84%, rgba(0,0,0,0) 100%)',
          }}
        >
          <img
            src="/assets/aistudio/Picsart_26-10-14_16-53-58-965_5e43343a.jpg"
            alt="Griya Indah Secawan"
            className="w-full h-full object-cover object-center"
            draggable={false}
          />
          {/* Subtle atmospheric blend at the bottom of the house photo */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#041f1c]/90" />
        </div>

        {/* Subtle radial golden glow behind the Griya Indah Secawan crest */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-[31%] w-[75%] h-[18%] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(218, 182, 95, 0.22) 0%, rgba(4, 30, 27, 0) 70%)',
          }}
        />

        {/* Layer 3: Ornate Golden Border & 3D "GRIYA INDAH SECAWAN" Crest */}
        <img
          src="/assets/aistudio/Meta_AI_border_griya_indah_secawan_transparent_v2_20261031_125936_a30c1315.png"
          alt="Griya Indah Secawan Frame"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10 drop-shadow-[0_10px_25px_rgba(0,0,0,0.65)]"
          draggable={false}
        />

        {/* Layer 4: Interactive Login Form Centered Inside the Ornate Frame */}
        <div className="absolute top-[29.5%] bottom-[24.5%] left-[16.5%] right-[16.5%] z-20 flex flex-col justify-center">
          <form onSubmit={handleSubmit} className="w-full flex flex-col">
            {/* USERNAME FIELD */}
            <div className="mb-3.5 sm:mb-4">
              <label className="block text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.08em] text-[#e6d5a7] mb-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                USERNAME
              </label>
              <div className="relative flex items-center">
                <User
                  className="w-4 h-4 sm:w-[17px] sm:h-[17px] text-[#cbb279] absolute left-3.5 pointer-events-none"
                  strokeWidth={1.9}
                />
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
                  className="w-full h-10 sm:h-11 pl-10 pr-3.5 rounded-[13px] bg-[#041d1a]/85 border border-[#c7ab6c]/75 text-xs sm:text-[13px] text-[#f5ecd4] placeholder:text-[#8ea59e] outline-none focus:border-[#f0d78c] focus:bg-[#041d1a]/95 shadow-[inset_0_2px_6px_rgba(0,0,0,0.55)] transition"
                />
              </div>
            </div>

            {/* PASSWORD FIELD */}
            <div className="mb-4 sm:mb-5">
              <label className="block text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.08em] text-[#e6d5a7] mb-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                PASSWORD
              </label>
              <div className="relative flex items-center">
                <Lock
                  className="w-4 h-4 sm:w-[17px] sm:h-[17px] text-[#cbb279] absolute left-3.5 pointer-events-none"
                  strokeWidth={1.9}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Masukkan password (admin)"
                  autoComplete="current-password"
                  className="w-full h-10 sm:h-11 pl-10 pr-10 rounded-[13px] bg-[#041d1a]/85 border border-[#c7ab6c]/75 text-xs sm:text-[13px] text-[#f5ecd4] placeholder:text-[#8ea59e] outline-none focus:border-[#f0d78c] focus:bg-[#041d1a]/95 shadow-[inset_0_2px_6px_rgba(0,0,0,0.55)] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#8ea59e] hover:text-[#e6d5a7] p-1 transition cursor-pointer"
                  title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" strokeWidth={1.9} />
                  ) : (
                    <Eye className="w-4 h-4" strokeWidth={1.9} />
                  )}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="w-full h-10 sm:h-11 rounded-[13px] border border-[#dec47c] text-[#052314] font-extrabold text-xs sm:text-[14px] flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer hover:brightness-105"
              style={{
                background:
                  'linear-gradient(180deg, #35df7f 0%, #17b960 55%, #0e994b 100%)',
                boxShadow:
                  '0 0 20px rgba(42, 212, 114, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.45)',
              }}
            >
              <LogIn className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#052314]" strokeWidth={2.4} />
              <span>Masuk ke Aplikasi</span>
            </button>

            {/* Error Feedback (if any) */}
            {error && (
              <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-red-950/90 border border-red-400/50 text-red-200 text-[11px] font-medium text-center shadow-lg">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Layer 5: Bottom Copyright Footer */}
        <div className="absolute bottom-[1.2%] left-0 right-0 z-20 text-center pointer-events-none px-4">
          <p className="text-[10px] sm:text-[11px] font-medium text-[#709088] tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
            © 2025 Griya Indah Secawan • Hunian Nyaman, Hidup Tenang
          </p>
        </div>
      </div>
    </div>
  );
};
