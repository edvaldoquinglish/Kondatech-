import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Phone, User, Lock, ArrowRight, ShieldCheck, Globe, Check, AlertCircle } from 'lucide-react';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSignUpDefault: boolean;
}

interface CountryData {
  name: string;
  code: string;
  flag: string;
  example: string;
  digitsNeeded: number[];
  maskLabel: string;
}

const SUPPORTED_COUNTRIES: CountryData[] = [
  { name: 'Brasil', code: '+55', flag: '🇧🇷', example: '(11) 99999-9999', digitsNeeded: [10, 11], maskLabel: 'DDD + 8 ou 9 dígitos' },
  { name: 'Angola', code: '+244', flag: '🇦🇴', example: '912 345 678', digitsNeeded: [9], maskLabel: '9 dígitos (inicia com 9)' },
  { name: 'Estados Unidos', code: '+1', flag: '🇺🇸', example: '(212) 555-0199', digitsNeeded: [10], maskLabel: 'Código de área + 7 dígitos' }
];

export function PhoneAuthModal({ isOpen, onClose, isSignUpDefault }: PhoneAuthModalProps) {
  const { signInWithPhonePassword } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(isSignUpDefault);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+55');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Lógica de análise numérica em tempo real
  const analyzeNumber = (input: string, activeCode: string) => {
    const rawVal = input.trim();
    // Limpar todos os caracteres que não sejam dígitos
    const cleanDigits = rawVal.replace(/[^0-9]/g, '');

    let detectedCode = activeCode;
    let autoDetected = false;

    // Verifique se a entrada digitada tenta explicitamente prefixar um código internacional.
    if (rawVal.startsWith('+55') || cleanDigits.startsWith('55')) {
      detectedCode = '+55';
      autoDetected = true;
    } else if (rawVal.startsWith('+244') || cleanDigits.startsWith('244')) {
      detectedCode = '+244';
      autoDetected = true;
    } else if (rawVal.startsWith('+1') || cleanDigits.startsWith('1')) {
      detectedCode = '+1';
      autoDetected = true;
    }

    const country = SUPPORTED_COUNTRIES.find(c => c.code === detectedCode) || SUPPORTED_COUNTRIES[0];
    const codeDigits = country.code.replace('+', '');
    
    // Extraia os dígitos locais removendo o prefixo do código do país, se digitado.
    let localDigits = cleanDigits;
    if (cleanDigits.startsWith(codeDigits)) {
      localDigits = cleanDigits.slice(codeDigits.length);
    }

    // Verificando validação
    const isValidLength = country.digitsNeeded.includes(localDigits.length);
    let isSpecificValid = isValidLength;
    let warning = '';

    if (country.code === '+244' && localDigits.length > 0) {
      // Angola numbers should start with 9 for mobiles
      if (!localDigits.startsWith('9')) {
        warning = 'Móveis em Angola geralmente iniciam com o dígito 9.';
      }
    }

    const formattedInternational = `+${codeDigits}${localDigits}`;

    return {
      country,
      localDigits,
      cleanDigits,
      isValid: isSpecificValid,
      warning,
      formattedInternational,
      autoDetected,
      detectedCode
    };
  };

  const analysis = analyzeNumber(phone, selectedCountryCode);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    
    // Sincronização automática da guia do país ativo selecionado ao digitar o prefixo
    const rawVal = val.trim();
    const cleanDigits = rawVal.replace(/[^0-9]/g, '');
    if (rawVal.startsWith('+55') || cleanDigits.startsWith('55')) {
      if (selectedCountryCode !== '+55') setSelectedCountryCode('+55');
    } else if (rawVal.startsWith('+244') || cleanDigits.startsWith('244')) {
      if (selectedCountryCode !== '+244') setSelectedCountryCode('+244');
    } else if (rawVal.startsWith('+1') || cleanDigits.startsWith('1')) {
      if (selectedCountryCode !== '+1') setSelectedCountryCode('+1');
    }
  };

  const handleCountrySelect = (code: string) => {
    setSelectedCountryCode(code);
    // Se o telefone iniciar com o prefixo antigo, vamos apagá-lo ou redefini-lo para ajudar o usuário.
    const currentAnalysis = analyzeNumber(phone, selectedCountryCode);
    if (currentAnalysis.autoDetected) {
      setPhone(''); // Empty to reset prefix comfortably
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const submitAnalysis = analyzeNumber(phone, selectedCountryCode);

    if (!phone || !submitAnalysis.isValid) {
      setErrorMsg(`Número inválido para o país selecionado (${submitAnalysis.country.name}). É necessário ${submitAnalysis.country.maskLabel}.`);
      setLoading(false);
      return;
    }

    if (isSignUp && !name) {
      setErrorMsg('O nome completo é obrigatório.');
      setLoading(false);
      return;
    }

    try {
      // Forneça um número de telefone internacional totalmente normalizado para garantir uma autenticação totalmente segura!
      await signInWithPhonePassword(submitAnalysis.formattedInternational, name, isSignUp);
      onClose();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message?.includes('email-already-in-use') 
        ? 'Erro: Este celular já está cadastrado.' 
        : 'Algo deu errado na autenticação. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full relative space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Botão para Fechar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modelo de Cabeçalho */}
        <div className="text-center space-y-1.5 pt-2">
          <div className="bg-teal-950/40 border border-teal-900 mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-teal-400 shadow-inner">
            <Phone className="w-5 h-5" />
          </div>
          <h2 className="font-display font-extrabold text-xl text-white">
            {isSignUp ? 'Criar Conta de Cliente' : 'Entrar na Konda Tech'}
          </h2>
          <p className="text-xs text-gray-400">
            Acesso com autenticação de celular integrada para Brasil, Angola e Estados Unidos.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/30 border border-red-900 rounded-xl text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Corpo de formas */}
        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-semibold flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Nome Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full bg-gray-950 border border-gray-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-xs text-gray-200 outline-none"
              />
            </div>
          )}

          {/* Abas de Seleção de País */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-semibold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-teal-500" /> Selecione o País de Origem
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SUPPORTED_COUNTRIES.map((cty) => {
                const isActive = selectedCountryCode === cty.code;
                return (
                  <button
                    key={cty.code}
                    type="button"
                    onClick={() => handleCountrySelect(cty.code)}
                    className={`py-2 px-1 rounded-xl text-xs border text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-teal-950/40 text-teal-300 border-teal-500/50 shadow-md shadow-teal-950/30' 
                        : 'bg-gray-950/65 text-gray-400 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <span className="text-base mb-0.5">{cty.flag}</span>
                    <span className="font-semibold text-[10px] tracking-wide">{cty.name}</span>
                    <span className="text-[9px] text-gray-500 font-mono">{cty.code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-semibold flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Número de Celular</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs font-semibold text-gray-500 font-mono">
                  {analysis.country.code}
                </span>
                <input
                  type="text"
                  required
                  placeholder={`Ex: ${analysis.country.example}`}
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-teal-500 rounded-xl pl-14 pr-4 py-2.5 text-xs text-gray-200 outline-none font-mono"
                />
              </div>
            </div>

            {/* Smart Phone Analysis Box */}
            <div className="bg-gray-950/80 border border-gray-800/80 rounded-2xl p-3 space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] font-mono tracking-wider uppercase text-gray-500">Módulo de Análise Analítica</span>
                <span className="flex items-center gap-1 font-semibold text-teal-400">
                  {analysis.country.flag} {analysis.country.name}
                </span>
              </div>
              
              <div className="space-y-1 font-mono text-[10px] text-gray-400">
                <div className="flex justify-between">
                  <span>DDI Detectado:</span>
                  <span className="text-gray-300 font-semibold">{analysis.detectedCode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dígitos Locais:</span>
                  <span className="text-gray-300">{analysis.localDigits || 'Aguardando digitação...'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mapeamento Final:</span>
                  <span className="text-teal-400">{analysis.formattedInternational}</span>
                </div>
              </div>

              {/* Indicador de status de validação */}
              <div className={`flex items-start gap-1.5 p-2 rounded-lg ${
                analysis.isValid 
                  ? 'bg-teal-950/20 border border-teal-900/30 text-teal-300' 
                  : 'bg-amber-950/15 border border-amber-900/20 text-amber-400'
              }`}>
                {analysis.isValid ? (
                  <Check className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-550 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5 text-[10px]">
                  <p className="font-semibold leading-normal">
                    {analysis.isValid ? 'Número Válido e Homologado' : 'Ajustando Estrutura Numérica'}
                  </p>
                  <p className="text-gray-400 leading-normal">
                    {analysis.isValid 
                      ? `Atende aos requisitos de autenticação para ${analysis.country.name}.`
                      : `Requer ${analysis.country.maskLabel} para validação.`
                    }
                  </p>
                  {analysis.warning && (
                    <p className="text-amber-500 font-semibold">{analysis.warning}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-semibold flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Senha Segura</label>
              <input
                type="password"
                required
                placeholder="Min. 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-xs text-gray-200 outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold py-3 px-4 rounded-xl cursor-pointer disabled:opacity-50 transition-all shadow-md shadow-teal-950/40"
            >
              {loading ? 'Processando...' : (isSignUp ? 'Criar Registro Completo' : 'Validar e Entrar')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Alternar o modo de conta Links do rodapé */}
        <div className="text-center pt-2">
          <button
            onClick={() => { setErrorMsg(''); setIsSignUp(!isSignUp); }}
            className="text-xs text-teal-400 hover:underline cursor-pointer"
          >
            {isSignUp ? 'Já possui conta de cliente? Entrar de forma segura' : 'Não tem conta? Criar conta de cliente grátis'}
          </button>
        </div>

        <div className="border-t border-gray-900 pt-4 text-center text-[10px] text-gray-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
          <span>Políticas de Escrow e Segurança Konda Tech Ativas</span>
        </div>

      </div>
    </div>
  );
}
