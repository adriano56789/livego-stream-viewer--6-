
import React, { useState } from 'react';
import { api } from '../services/api';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
        if (isRegistering) {
            if (!name) throw new Error("Nome é obrigatório.");
            await api.auth.register(name, email);
            // Auto login after register or just proceed
            onLogin();
        } else {
            await api.auth.login(email);
            onLogin();
        }
    } catch (err: any) {
        console.error("Auth error:", err);
        setError(err.message || "Falha na autenticação. Verifique suas credenciais.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-black font-sans text-white overflow-hidden">
      
      <div className="z-10 w-full max-w-sm px-8 flex flex-col items-center justify-center min-h-[600px]">
        
        {/* Seção do Logo */}
        <div className="mb-12 text-center">
            <h1 className="text-6xl font-black italic tracking-tighter text-white drop-shadow-2xl" style={{ fontFamily: 'Arial, sans-serif' }}>
                LiveGo
            </h1>
            <p className="text-xs font-bold tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase mt-2 drop-shadow-sm">
                EXPERIÊNCIA VIP REAL
            </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
            {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-xl text-sm text-center mb-4">
                    {error}
                </div>
            )}

            {isRegistering && (
                 <input 
                    type="text" 
                    placeholder="Seu nome real ou apelido" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur-md transition-all"
                    disabled={isLoading}
                 />
            )}
            
            <input 
                type="email" 
                placeholder={isRegistering ? "seu@email.com" : "E-mail ou ID"} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur-md transition-all"
                disabled={isLoading}
            />
            
            <input 
                type="password" 
                placeholder={isRegistering ? "Crie uma senha segura" : "Senha"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur-md transition-all"
                disabled={isLoading}
            />

            <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#a855f7] to-[#db2777] text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:opacity-90 active:scale-[0.98] transition-all uppercase tracking-wide text-lg mt-6 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
            >
                {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    isRegistering ? "CRIAR MINHA CONTA" : "ENTRAR"
                )}
            </button>
        </form>

        {/* Links de Rodapé */}
        <div className="mt-12 text-center">
            <p className="text-gray-400 text-sm mb-3">
                {isRegistering ? "Já possui uma conta ativa?" : "Ainda não tem acesso?"}
            </p>
            <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                className="relative text-white font-bold text-sm tracking-wider uppercase group pb-1"
                disabled={isLoading}
            >
                {isRegistering ? "FAZER LOGIN NO SISTEMA" : "CRIAR MINHA CONTA AGORA"}
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-100 transition-transform"></span>
            </button>
        </div>

      </div>

      {/* Versão no Rodapé */}
      <div className="absolute bottom-8 z-10 text-white/20 text-[10px] font-bold tracking-[0.2em] uppercase">
        SERVIDOR REAL LIVEGO ONLINE V1.0
      </div>
    </div>
  );
};

export default LoginScreen;
