import React from 'react';
import { Shield, Sparkles, Building, PhoneCall } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-900 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Descrição dos direitos autorais */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-400" />
              <span className="font-display font-bold text-lg tracking-tight text-white">KONDA TECH</span>
            </div>
            <p className="text-xs text-gray-400 max-w-sm">
              A comunidade definitiva de desenvolvedores e clientes. Contratações seguras com escrow, chat integrado e reputação profissional verificada.
            </p>
          </div>

          {/* Métricas rápidas (Recursos simulados) */}
          <div className="flex flex-col md:items-center space-y-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Estatísticas Globais
            </span>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <div className="text-sm font-bold text-gray-200">99.8%</div>
                <div className="text-[10px] text-gray-500">Projetos Entregues</div>
              </div>
              <div>
                <div className="text-sm font-bold text-gray-200">10%</div>
                <div className="text-[10px] text-gray-500">Taxa Plana Escrow</div>
              </div>
            </div>
          </div>

          {/* Links de suporte */}
          <div className="space-y-2 md:text-right">
            <div className="text-sm text-gray-300 font-semibold">Suporte ao Cliente</div>
            <p className="text-xs text-gray-400">
              Precisa de ajuda com uma disputa de saldo ou aprovação de conta? Entre em contato com nossos administradores principais.
            </p>
            <div className="text-[11px] text-teal-400 font-mono flex md:justify-end items-center gap-1">
              <PhoneCall className="w-3 h-3" /> support@kondatech.val
            </div>
          </div>

        </div>

        <div className="border-t border-gray-900/60 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div>
            &copy; {new Date().getFullYear()} Konda Tech Inc. Todos os direitos reservados.
          </div>
          <div className="flex gap-4">
            <span className="hover:text-gray-300 transition-colors cursor-pointer">Termos de Escrow</span>
            <span className="hover:text-gray-300 transition-colors cursor-pointer">Segurança JWT</span>
            <span className="hover:text-gray-300 transition-colors cursor-pointer">Política KYC</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
