import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { User, Project, Payment, formatMoney } from '../types';
import { 
  Shield, 
  Users, 
  Briefcase, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Star, 
  Sliders, 
  Clock, 
  Lock, 
  FolderCheck,
  TrendingUp,
  Award,
  Trash2,
  LockKeyhole,
  Check,
  UserX,
  AlertTriangle,
  History
} from 'lucide-react';

export function AdminPanel() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  // Redirecionar se não autorizado
  useEffect(() => {
    if (authUser && !authUser.admin) {
      alert('Sessão restrita. Apenas administradores oficiais podem gerenciar o Console.');
      navigate('/dashboard');
    }
  }, [authUser, navigate]);

  // Filas de estado do Firestore
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [escrows, setEscrows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Sincronizar usuários, projetos e recebimentos de pagamentos.
  useEffect(() => {
    if (!authUser || !authUser.admin) return;

    setLoading(true);
    const pathUsers = 'users';
    const unsubUsers = onSnapshot(collection(db, pathUsers), (snap) => {
      const u: User[] = [];
      snap.forEach(d => {
        u.push({ id: d.id, ...d.data() } as User);
      });
      // Sort: admins first
      u.sort((a,b) => (b.admin ? 1 : 0) - (a.admin ? 1 : 0));
      setUsers(u);
    }, (err) => handleFirestoreError(err, OperationType.LIST, pathUsers));

    const pathProjects = 'projects';
    const unsubProjs = onSnapshot(collection(db, pathProjects), (snap) => {
      const p: Project[] = [];
      snap.forEach(d => {
        p.push({ id: d.id, ...d.data() } as Project);
      });
      setProjects(p);
    }, (err) => handleFirestoreError(err, OperationType.LIST, pathProjects));

    const pathPayments = 'payments';
    const unsubPayments = onSnapshot(collection(db, pathPayments), (snap) => {
      const pay: Payment[] = [];
      snap.forEach(d => {
        pay.push({ id: d.id, ...d.data() } as Payment);
      });
      setEscrows(pay);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, pathPayments));

    return () => {
      unsubUsers();
      unsubProjs();
      unsubPayments();
    };
  }, [authUser]);

  // Aprova o perfil de verificação do desenvolvedor (status KYC)
  const handleVerifyUser = async (targetId: string, verifiedStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', targetId), { verified: verifiedStatus });
      alert(`Status de verificação do prestador alterado para: [${verifiedStatus ? 'Verificado' : 'Pendente'}].`);
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar status de verificação.');
    }
  };

  // Promove o usuário a Administrador.
  const handlePromoteAdmin = async (targetId: string) => {
    const totalAdmins = users.filter(u => u.admin === true).length;
    const confirmPromote = window.confirm(`Deseja promover este membro do ecossistema a Administrador Principal? Atualmente contamos com ${totalAdmins} administradores.`);
    if (!confirmPromote) return;

    try {
      await updateDoc(doc(db, 'users', targetId), { admin: true, role: 'admin', verified: true });
      alert('Usuário promovido a Administrador Principal com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao processar promoção administrativa.');
    }
  };

  // Ajustar pontos de reputação do usuário
  const handleAdjustReputation = async (targetId: string, currentRep: number, delta: number) => {
    try {
      const newRep = Math.max(0, currentRep + delta);
      await updateDoc(doc(db, 'users', targetId), { reputation: newRep });
    } catch (e) {
      console.error('Rep adjustment issue:', e);
    }
  };

  // Arbitragem de intermediário de garantia: forçando pagamentos ou reembolsos
  const handleArbitrateEscrow = async (paymentId: string, action: 'release' | 'refund', projectId: string) => {
    const confirmation = window.confirm(`ARBITRAGEM DE DISPUTA: Você tem certeza que deseja forçar a ação [${action === 'release' ? 'Liberar Dinheiro ao Dev' : 'Reembolsar Cliente'}]? Esta operação é irreversível.`);
    if (!confirmation) return;

    try {
      const nextStatus = action === 'release' ? 'released' : 'refunded';
      
      // Atualizar detalhes de pagamento e projeto
      await updateDoc(doc(db, 'payments', paymentId), { escrow_status: nextStatus });
      await updateDoc(doc(db, 'projects', projectId), { status: action === 'release' ? 'completed' : 'open' });
      
      alert('Decisão de Arbitragem Konda Tech consolidada com sucesso no Escrow legal!');
    } catch (e) {
      console.error('Arbitration error:', e);
      alert('Erro ao executar decisões judiciais de escrow.');
    }
  };

  // Alternar banimento de usuário (Simulado ao redefinir a reputação ou ativar/desativar o status de verificado)
  const handleBanUser = async (targetUser: User) => {
    const isBanned = targetUser.reputation === 0;
    const confirmBan = window.confirm(`Deseja ${isBanned ? 'DESBANIR' : 'BANIR'} a conta de ${targetUser.name}?`);
    if (!confirmBan) return;

    try {
      await updateDoc(doc(db, 'users', targetUser.id), {
        reputation: isBanned ? 100 : 0,
        verified: isBanned ? true : false,
      });
      alert(`Conta de ${targetUser.name} mudou para status: [${isBanned ? 'Ativo' : 'Banido'}].`);
    } catch (e) {
      console.error('Banning issue:', e);
    }
  };

  // Cálculos de estatísticas de alto nível do sistema para exibições analíticas, divididas por moeda.
  const earnKz = escrows.reduce((acc, c) => (c.escrow_status === 'released' && (c.currency === 'Kz' || !c.currency)) ? acc + c.fee : acc, 0);
  const earnBrl = escrows.reduce((acc, c) => (c.escrow_status === 'released' && c.currency === 'R$') ? acc + c.fee : acc, 0);
  const earnUsd = escrows.reduce((acc, c) => (c.escrow_status === 'released' && c.currency === 'USD') ? acc + c.fee : acc, 0);

  const volKz = escrows.reduce((acc, c) => (c.currency === 'Kz' || !c.currency) ? acc + c.amount : acc, 0);
  const volBrl = escrows.reduce((acc, c) => (c.currency === 'R$') ? acc + c.amount : acc, 0);
  const volUsd = escrows.reduce((acc, c) => (c.currency === 'USD') ? acc + c.amount : acc, 0);

  const pendingKYCUsers = users.filter(u => !u.verified && (u.role === 'freelancer' || u.role === 'admin' ));
  const activeDisputes = projects.filter(p => p.status === 'disputed').length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <Clock className="w-10 h-10 text-red-400 animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Carregando painel de moderação e auditorias...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-screen">
      
      {/* Admin Title Info */}
      <div className="bg-red-950/20 border border-red-900/60 rounded-3xl p-6 md:p-8 space-y-2">
        <div className="flex items-center gap-2 text-red-400">
          <Shield className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider">Console Governamental Administrativo</span>
        </div>
        <h1 className="text-2xl md:text-3.5xl font-display font-extrabold text-white">
          Konda Tech Control Center
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl">
          Supervisão integral de contas de desenvolvedores, faturas de custódias, liberação de fundos em disputas judiciais e relatórios de auditoria financeira.
        </p>
      </div>

      {/* Analytics Dashboard Grid Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-gray-950 border border-gray-905 p-5 rounded-2xl space-y-1.5">
          <span className="text-xs text-gray-500 font-mono uppercase tracking-wider block">Total de Usuários Cadastrados</span>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-black text-white">{users.length}</span>
            <Users className="w-5 h-5 text-teal-400" />
          </div>
          <span className="text-[10px] text-gray-500 block">Clientes, Devs e Co-admins</span>
        </div>

        <div className="bg-gray-950 border border-gray-905 p-5 rounded-2xl space-y-1.5 font-display">
          <span className="text-xs text-gray-500 font-mono uppercase tracking-wider block">Faturamento Recebido (Taxas 10%)</span>
          <div className="flex flex-col gap-0.5 text-teal-400 font-black">
            <span>Kz: {earnKz.toLocaleString()}</span>
            <span>R$: {earnBrl.toLocaleString()}</span>
            <span>USD: {earnUsd.toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-gray-500 block">Taxas planas consolidadas em saques</span>
        </div>

        <div className="bg-gray-950 border border-gray-905 p-5 rounded-2xl space-y-1.5">
          <span className="text-xs text-gray-500 font-mono uppercase tracking-wider block">Desenvolvedores Pendentes KYC</span>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-black text-yellow-400">{pendingKYCUsers.length}</span>
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <span className="text-[10px] text-gray-500 block">Contas aguardando revisão manual</span>
        </div>

        <div className="bg-gray-950 border border-gray-905 p-5 rounded-2xl space-y-1.5">
          <span className="text-xs text-gray-500 font-mono uppercase tracking-wider block">Volume Transacionado de Negócios</span>
          <div className="flex flex-col gap-0.5 text-sky-400 font-black">
             <span>Kz: {volKz.toLocaleString()}</span>
             <span>R$: {volBrl.toLocaleString()}</span>
             <span>USD: {volUsd.toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-gray-500 block">Total histórico caucionado e movimentado</span>
        </div>

      </section>

      {/* Verification Queue Section (Aprovação de Prestadores) */}
      <section className="bg-gray-950 border border-gray-900 rounded-3xl p-6 shadow-md space-y-5">
        <div className="flex items-center gap-2 border-b border-gray-900 pb-3">
          <FolderCheck className="w-5 h-5 text-yellow-500" />
          <h2 className="font-display font-bold text-lg text-white">Fila de Análise KYC (Contas Pendentes de Validação)</h2>
        </div>

        {pendingKYCUsers.length === 0 ? (
          <p className="text-xs text-gray-500 py-3 italic">Todas as contas de desenvolvedores foram revisadas. Ótimo trabalho!</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingKYCUsers.map(dev => (
              <div key={dev.id} className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gray-750 transition-all">
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <img src={dev.avatar} alt={dev.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h3 className="font-display font-bold text-sm text-white">{dev.name}</h3>
                      <p className="text-[10px] text-gray-500 font-mono">{dev.email} | Celular: {dev.phone || 'G-Login'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 italic max-w-xl">"Bio: {dev.bio || 'Sem descrição.'}"</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleVerifyUser(dev.id, true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" /> Aprovar Conta
                  </button>
                  <Link
                    to={`/profile/${dev.id}`}
                    className="flex-1 md:flex-none flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-750 transition-colors"
                  >
                    Examinar Portfólio
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}
      </section>

      {/* Escrow and Disputes Arbitration Console (Arbitragem de Disputas de Dinheiro) */}
      <section className="bg-gray-950 border border-gray-900 rounded-3xl p-6 shadow-md space-y-5">
        <div className="flex items-center gap-2 border-b border-gray-900 pb-3">
          <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
          <h2 className="font-display font-bold text-lg text-white">Central de Resolução Judiciárias (Custódia & Escrow)</h2>
        </div>

        {escrows.filter(p => p.escrow_status === 'held').length === 0 ? (
          <p className="text-xs text-gray-500 py-3 italic">Não existem fundos caucionados ou em litígio precisando de arbitragem de momento.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {escrows.filter(p => p.escrow_status === 'held').map(pay => (
              <div key={pay.id} className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gray-750 transition-all">
                
                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-sm text-white">{pay.project_title}</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-400">
                    <div>Cliente: <span className="text-gray-200 font-semibold">{pay.client_id.slice(0, 8)}</span></div>
                    <div>Developer: <span className="text-gray-200 font-semibold">{pay.freelancer_id.slice(0, 8)}</span></div>
                  </div>
                  {pay.receipt_name ? (
                    <div className="mt-1 text-[11px] text-amber-500 font-medium">
                      <span>Recibo Manual: </span>
                      <a href={pay.receipt_url} target="_blank" rel="noreferrer" className="underline hover:text-teal-400 font-bold">
                        {pay.receipt_name}
                      </a>
                      <span className="text-gray-500"> ({pay.receipt_confirmed ? 'Confirmado pelo Dev ✓' : 'Aguardando validação do Dev ⏳'})</span>
                    </div>
                  ) : (
                    <div className="mt-1 text-[10px] text-gray-500 italic">Nenhum recibo manual anexado para esta transação (via gateway ou chat pendente).</div>
                  )}
                  <div className="text-[10px] text-gray-500 font-mono">Guia de Custódia: {pay.id}</div>
                </div>

                <div className="flex gap-3 items-center w-full md:w-auto self-stretch justify-between md:justify-end">
                  <div className="text-left md:text-right mr-3">
                    <span className="text-[10px] text-gray-500 font-mono block">Valor Alvo</span>
                    <span className="text-sm font-extrabold text-teal-300">{formatMoney(pay.amount, pay.currency)}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleArbitrateEscrow(pay.id, 'refund', pay.project_id)}
                      className="bg-red-950/40 border border-red-800/80 text-red-400 hover:bg-red-900/40 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-colors"
                      title="Estornar montante para o contratante"
                    >
                      Reembolsar Cliente
                    </button>
                    <button
                      onClick={() => handleArbitrateEscrow(pay.id, 'release', pay.project_id)}
                      className="bg-emerald-950/40 border border-emerald-850 text-emerald-400 hover:bg-emerald-900/40 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-colors"
                      title="Autorizar faturamento do desenvolvedor"
                    >
                      Pagar Dev
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </section>

      {/* Directory of users */}
      <section className="bg-gray-950 border border-gray-900 rounded-3xl p-6 shadow-md space-y-4">
        <h3 className="font-display font-bold text-base text-gray-200">Gerenciamento Geral de Identidades</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-900 text-gray-500 uppercase tracking-widest text-[9px] font-mono">
                <th className="py-3 px-2">Usuário</th>
                <th className="py-3 px-2">Role</th>
                <th className="py-3 px-2">Status KYC</th>
                <th className="py-3 px-2">Reputação</th>
                <th className="py-3 px-2 text-right">Ações de Controle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900 text-gray-300">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-900/20">
                  <td className="py-3.5 px-2 flex items-center gap-2.5">
                    <img src={u.avatar} alt={u.name} className="w-6.5 h-6.5 rounded-full object-cover" />
                    <div className="truncate max-w-[140px]">
                      <div className="font-semibold text-white truncate">{u.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono truncate">{u.email}</div>
                    </div>
                  </td>
                  <td className="py-3.5 px-2 font-mono">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.admin ? 'bg-red-950/40 text-red-300 border border-red-900' :
                      u.role === 'freelancer' ? 'bg-teal-950/40 text-teal-300 border border-teal-900' : 'bg-gray-900 text-gray-400 border border-gray-800'
                    }`}>{u.admin ? 'ADMIN' : u.role.toUpperCase()}</span>
                  </td>
                  <td className="py-3.5 px-2">
                    <span className={`text-[10px] font-bold ${u.verified ? 'text-teal-400' : 'text-amber-500'}`}>
                      {u.verified ? 'Aprovado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-amber-400 font-mono font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{u.reputation}</span>
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      
                      {/* Reward Rep button */}
                      <button 
                        onClick={() => handleAdjustReputation(u.id, u.reputation, 10)}
                        className="bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-amber-400 p-1.5 rounded-lg text-xs"
                        title="Atribuir reputação (+10 pt)"
                      >
                        +10 Rep
                      </button>

                      {/* Promote Admin flag */}
                      {!u.admin && (
                        <button
                          onClick={() => handlePromoteAdmin(u.id)}
                          className="bg-red-950/30 hover:bg-red-900/40 text-red-400 p-1.5 rounded-lg hover:text-white"
                          title="Promover para Administrador"
                        >
                          <LockKeyhole className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Ban toggler */}
                      {authUser?.id !== u.id && (
                        <button
                          onClick={() => handleBanUser(u)}
                          className={`p-1.5 rounded-lg ${u.reputation === 0 ? 'bg-teal-950/30 text-teal-400' : 'bg-red-950/30 text-red-400 hover:bg-red-900/40'}`}
                          title={u.reputation === 0 ? 'Desbanir Usuário' : 'Banir Usuário'}
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
