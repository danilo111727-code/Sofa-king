import { useState } from "react";
import { useLocation } from "wouter";
import { adminLogin } from "@/lib/api";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminLogin(password);
      navigate("/admin");
    } catch {
      setError("Senha incorreta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1208] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-[#c9a96e] text-4xl mb-2">♛</div>
          <h1 className="text-white text-2xl font-semibold tracking-wide">Sofa King</h1>
          <p className="text-[#a08060] text-sm mt-1">Painel Administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#261a0e] border border-[#3d2e1e] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white text-lg font-medium mb-6">Entrar</h2>

          <div className="mb-5">
            <label className="block text-[#a08060] text-sm mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a1208] border border-[#3d2e1e] rounded-lg px-4 py-3 text-white placeholder-[#5a4030] focus:outline-none focus:border-[#c9a96e] transition-colors"
              placeholder="••••••••"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c9a96e] hover:bg-[#b8954f] disabled:opacity-50 text-[#1a1208] font-semibold rounded-lg py-3 transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-[#5a4030] text-xs mt-6">
          ← <a href="/" className="hover:text-[#a08060] transition-colors">Voltar ao site</a>
        </p>
      </div>
    </div>
  );
}
