import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  User as UserIcon, 
  LogOut, 
  Coins, 
  Award, 
  Menu, 
  X, 
  Lock, 
  Phone, 
  Chrome,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface HeaderProps {
  onOpenPhoneAuth: (isSignUp: boolean) => void;
}

export function Header({ onOpenPhoneAuth }: HeaderProps) {
  const { user, signInWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (e) {
      console.error('Google login error in header:', e);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-gray-950 border-b border-gray-800 shadow-lg backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logótipo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-gradient-to-tr from-teal-600 to-sky-500 p-2.5 rounded-xl shadow-md transition-transform group-hover:scale-105 duration-300">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-2xl tracking-tight bg-gradient-to-r from-teal-400 via-sky-400 to-white bg-clip-text text-transparent">
                  KONDA<span className="text-gray-400 font-semibold text-lg ml-0.5 font-sans">TECH</span>
                </span>
                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono -mt-1 font-semibold">
                  Freelance Hub & Tech Community
                </span>
              </div>
            </Link>
          </div>

          {/* Navegação desktop */}
          <nav className="hidden md:flex items-center gap-4">
            <Link to="/" className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-2">
              Início
            </Link>
            
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-2">
                  Painel de Trabalho
                </Link>

                {/* Distintivo de reputação */}
                <div className="flex items-center gap-1.5 bg-gray-900 border border-teal-950/40 px-3 py-1.5 rounded-lg text-xs" title="Reputação Profissional Konda">
                  <Award className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="text-gray-400 font-medium">Reputação:</span>
                  <span className="font-mono font-bold text-amber-300">{user.reputation}</span>
                </div>

                {/* Selo de verificação */}
                <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                  user.verified 
                    ? 'bg-teal-950/30 border-teal-800 text-teal-400' 
                    : 'bg-amber-950/20 border-amber-800/60 text-amber-400'
                }`}>
                  {user.verified ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verificado</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Pendente KYC</span>
                    </>
                  )}
                </div>

                {/* status de administrador */}
                {user.admin && (
                  <Link to="/admin" className="flex items-center gap-1 bg-red-950/40 border border-red-800 text-red-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-900/50 transition-colors">
                    <Lock className="w-3.5 h-3.5" />
                    Console Admin
                  </Link>
                )}

                {/* Link do perfil */}
                <Link to={`/profile/${user.id}`} className="flex items-center gap-2 bg-gray-900 border border-gray-800 hover:border-gray-700 px-3 py-1.5 rounded-lg text-sm text-gray-300 transition-colors">
                  <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover bg-gray-800" referrerPolicy="no-referrer" />
                  <span className="truncate max-w-[120px] font-medium">{user.name}</span>
                </Link>

                {/* Sair */}
                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-gray-900/60 transition-colors cursor-pointer"
                  title="Sair da Conta"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {/* Login do cliente (Telefone/Senha) */}
                <button
                  onClick={() => onOpenPhoneAuth(false)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-200 border border-gray-700 hover:border-gray-500 bg-gray-900 px-4 py-2 rounded-xl transition-all hover:bg-gray-800 cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-teal-400" />
                  Sou Cliente (Celular)
                </button>

                {/* Login de desenvolvedor (Login do Google) */}
                <button
                  onClick={handleGoogleLogin}
                  className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 px-4 py-2 rounded-xl shadow-lg hover:shadow-teal-950/20 hover:scale-[1.02] transform transition-all cursor-pointer"
                >
                  <Chrome className="w-4 h-4" />
                  Sou Dev (Google)
                </button>
              </div>
            )}
          </nav>

          {/* Botão de menu móvel */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-900/60 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu móvel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-950 border-b border-gray-800 py-4 px-4 space-y-3">
          <Link 
            to="/" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-gray-300 hover:text-white py-2"
          >
            Início
          </Link>
          
          {user ? (
            <div className="space-y-3 pt-2 border-t border-gray-900">
              <Link 
                to="/dashboard" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-gray-300 hover:text-white py-2"
              >
                Painel de Trabalho
              </Link>
              
              {user.admin && (
                <Link 
                  to="/admin" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-base font-medium text-red-400 hover:text-red-300 py-2"
                >
                  <Lock className="w-4 h-4" />
                  Console Admin
                </Link>
              )}

              <Link 
                to={`/profile/${user.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-base font-medium text-gray-300 hover:text-white py-2"
              >
                <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                <span>Perfil ({user.name})</span>
              </Link>

              <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/20 p-2 rounded-lg">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Reputação: <strong>{user.reputation}</strong></span>
              </div>

              <button 
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="flex items-center gap-2 text-base font-medium text-red-500 py-2 w-full text-left"
              >
                <LogOut className="w-5 h-5" />
                Encerrar Sessão
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-2 border-t border-gray-900">
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenPhoneAuth(false); }}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-200 border border-gray-700 bg-gray-900 px-4 py-3 rounded-xl hover:bg-gray-800 transition-colors"
              >
                <Phone className="w-4 h-4 text-teal-400" />
                Sou Cliente (Celular)
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); handleGoogleLogin(); }}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-teal-500 px-4 py-3 rounded-xl shadow-lg transition-colors"
              >
                <Chrome className="w-4 h-4" />
                Sou Dev (Google Login)
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
