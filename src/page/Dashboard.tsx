import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  getDoc,
  serverTimestamp,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Project, Proposal, Payment, ChatRoom, User, formatMoney } from '../types';
import { 
  PlusCircle, 
  Briefcase, 
  FileText, 
  MessageSquare, 
  DollarSign, 
  CheckCircle, 
  Send, 
  User as UserIcon, 
  Clock, 
  ShieldAlert, 
  Settings,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Plus,
  TrendingUp,
  FileCheck,
  CheckCircle2,
  X,
  CreditCard,
  Ban,
  Slash,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { user, profile, updateDevProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  // Navigation and form states
  const [activeTab, setActiveTab] = useState<'my-projects' | 'explore-jobs' | 'bids' | 'escrow' | 'profile-settings'>('explore-jobs');
  const [isRoleToggle, setIsRoleToggle] = useState<'client' | 'freelancer'>('freelancer');

  // Firestore Sync States
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [freelancerProposals, setFreelancerProposals] = useState<Proposal[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeChats, setActiveChats] = useState<ChatRoom[]>([]);

  // Detailed Modal/Selection views
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectProposals, setProjectProposals] = useState<Proposal[]>([]);
  const [showDocExporter, setShowDocExporter] = useState<{ type: 'contract' | 'invoice' | 'receipt', payload: any } | null>(null);

  // Form Inputs
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('Desenvolvimento');
  const [postBudget, setPostBudget] = useState('');
  const [postCurrency, setPostCurrency] = useState<'Kz' | 'R$' | 'USD'>('Kz');
  const [postDeadline, setPostDeadline] = useState('');
  const [postDesc, setPostDesc] = useState('');

  // Bid Inputs
  const [bidPrice, setBidPrice] = useState('');
  const [bidDeadline, setBidDeadline] = useState('');
  const [bidMessage, setBidMessage] = useState('');

  // Profile Edit Inputs
  const [profileBio, setProfileBio] = useState(user?.bio || '');
  const [profileSkills, setProfileSkills] = useState(profile?.skills?.join(', ') || 'React, TypeScript, Node.js');
  const [profilePortfolio, setProfilePortfolio] = useState(profile?.portfolio || '');
  const [profileExperience, setProfileExperience] = useState(profile?.experience || '');
  const [profileGithub, setProfileGithub] = useState(profile?.github || '');
  const [profileLinkedin, setProfileLinkedin] = useState(profile?.linkedin || '');

  // Feed Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Load user initial role settings
  useEffect(() => {
    if (user) {
      setIsRoleToggle(user.role === 'client' ? 'client' : 'freelancer');
      setProfileBio(user.bio || '');
      if (user.role === 'client') {
        setActiveTab('my-projects');
      } else {
        setActiveTab('explore-jobs');
      }
    }
  }, [user]);

  // Sycnronize profile settings
  useEffect(() => {
    if (profile) {
      setProfileSkills(profile.skills.join(', '));
      setProfilePortfolio(profile.portfolio);
      setProfileExperience(profile.experience);
      setProfileGithub(profile.github || '');
      setProfileLinkedin(profile.linkedin || '');
    }
  }, [profile]);

  // Real-time listener for ALL active collections to keep dashboard high-fidelity
  useEffect(() => {
    if (!user) return;

    const pathProjects = 'projects';
    const unsubscribeProjects = onSnapshot(collection(db, pathProjects), (snapshot) => {
      const projs: Project[] = [];
      snapshot.forEach((doc) => {
        projs.push({ id: doc.id, ...doc.data() } as Project);
      });
      // Sort
      projs.sort((a,b) => b.created_at.localeCompare(a.created_at));
      setAllProjects(projs);
      setClientProjects(projs.filter(p => p.client_id === user.id));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, pathProjects);
    });

    const pathProposals = 'proposals';
    const unsubscribeProposals = onSnapshot(collection(db, pathProposals), (snapshot) => {
      const bids: Proposal[] = [];
      snapshot.forEach((doc) => {
        bids.push({ id: doc.id, ...doc.data() } as Proposal);
      });
      setFreelancerProposals(bids.filter(b => b.freelancer_id === user.id));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, pathProposals);
    });

    const pathPayments = 'payments';
    const unsubscribePayments = onSnapshot(collection(db, pathPayments), (snapshot) => {
      const pay: Payment[] = [];
      snapshot.forEach((doc) => {
        pay.push({ id: doc.id, ...doc.data() } as Payment);
      });
      setPayments(pay.filter(p => p.client_id === user.id || p.freelancer_id === user.id));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, pathPayments);
    });

    const pathChats = 'chats';
    const unsubscribeChats = onSnapshot(collection(db, pathChats), (snapshot) => {
      const rooms: ChatRoom[] = [];
      snapshot.forEach((doc) => {
        rooms.push({ id: doc.id, ...doc.data() } as ChatRoom);
      });
      setActiveChats(rooms.filter(c => c.client_id === user.id || c.freelancer_id === user.id));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, pathChats);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeProposals();
      unsubscribePayments();
      unsubscribeChats();
    };
  }, [user]);

  // Load proposals specifically related to selected project review modal
  useEffect(() => {
    if (!selectedProject) return;
    const pathProps = 'proposals';
    const q = query(collection(db, pathProps), where('project_id', '==', selectedProject.id));
    const unsubscribeSelectedProps = onSnapshot(q, (snapshot) => {
      const bids: Proposal[] = [];
      snapshot.forEach((doc) => {
        bids.push({ id: doc.id, ...doc.data() } as Proposal);
      });
      setProjectProposals(bids);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, pathProps);
    });

    return () => unsubscribeSelectedProps();
  }, [selectedProject]);

  // Trigger Client Job Post
  const handlePostProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!postTitle || !postBudget || !postDesc) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const budgetVal = parseFloat(postBudget);
    if (isNaN(budgetVal) || budgetVal <= 0) {
      alert('Orçamento deve ser um número válido.');
      return;
    }

    const path = 'projects';
    const newProjPayload = {
      client_id: user.id,
      client_name: user.name,
      title: postTitle,
      category: postCategory,
      budget: budgetVal,
      currency: postCurrency,
      deadline: postDeadline || 'A combinar',
      description: postDesc,
      status: 'open' as const,
      created_at: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, path), newProjPayload);
      setPostTitle('');
      setPostBudget('');
      setPostCurrency('Kz');
      setPostDeadline('');
      setPostDesc('');
      alert('Projeto publicado com sucesso! Aguarde propostas dos desenvolvedores.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  // Submit Freelancer proposal
  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedProject) return;

    if (!user.verified) {
      alert('Seu perfil de prestador está pendente de aprovação pela administração. Apenas DEVS aprovados podem enviar propostas.');
      return;
    }

    const priceVal = parseFloat(bidPrice);
    if (isNaN(priceVal) || priceVal <= 0) {
      alert('Preço deve ser um número positivo.');
      return;
    }

    if (!bidMessage) {
      alert('Por favor, escreva uma mensagem detalhando sua proposta técnica.');
      return;
    }

    const path = 'proposals';
    const bidPayload = {
      project_id: selectedProject.id,
      project_title: selectedProject.title,
      freelancer_id: user.id,
      freelancer_name: user.name,
      freelancer_avatar: user.avatar,
      price: priceVal,
      currency: selectedProject.currency || 'Kz',
      deadline: bidDeadline || '7 dias',
      message: bidMessage,
      status: 'pending' as const,
      created_at: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, path), bidPayload);
      setBidPrice('');
      setBidDeadline('');
      setBidMessage('');
      setSelectedProject(null);
      alert('Proposta enviada com sucesso! O cliente receberá seu orçamento.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  // Client accept freelancer bid (Create Payments Escrow & Start Project)
  const handleAcceptProposal = async (bid: Proposal) => {
    if (!user) return;
    
    const bidCurrency = bid.currency || 'Kz';
    const confirmAccept = window.confirm(`Deseja aceitar a proposta de ${bid.freelancer_name} no valor de ${formatMoney(bid.price, bidCurrency)}? O valor integral será caucionado em escrow.`);
    if (!confirmAccept) return;

    try {
      // 1. Update project state
      await updateDoc(doc(db, 'projects', bid.project_id), {
        status: 'active',
        freelancer_id: bid.freelancer_id,
        freelancer_name: bid.freelancer_name
      });

      // 2. Accept this proposal, reject others
      await updateDoc(doc(db, 'proposals', bid.id), { status: 'accepted' });
      
      const otherBids = projectProposals.filter(p => p.id !== bid.id);
      for (const otherBid of otherBids) {
        await updateDoc(doc(db, 'proposals', otherBid.id), { status: 'rejected' });
      }

      // 3. Setup Escrow Payment (10% flat platform fee)
      const fee = bid.price * 0.10;
      const freelancerAmount = bid.price - fee;
      
      const newPayment: Partial<Payment> = {
        project_id: bid.project_id,
        project_title: bid.project_title,
        amount: bid.price,
        fee: fee,
        freelancer_amount: freelancerAmount,
        escrow_status: 'held',
        client_id: user.id,
        freelancer_id: bid.freelancer_id,
        created_at: new Date().toISOString(),
        currency: bidCurrency,
        payment_method: 'gateway',
        receipt_confirmed: false
      };
      
      await addDoc(collection(db, 'payments'), newPayment);

      // 4. Create chat room channel automatically for collaborative dev work
      const newChat: Partial<ChatRoom> = {
        project_id: bid.project_id,
        project_title: bid.project_title,
        client_id: user.id,
        freelancer_id: bid.freelancer_id,
        client_name: user.name,
        freelancer_name: bid.freelancer_name,
        last_message: 'Contrato técnico assinado! Canal de chat instantâneo ativado.',
        updated_at: new Date().toISOString()
      };
      await addDoc(collection(db, 'chats'), newChat);

      setSelectedProject(null);
      alert('Contrato firmado! O montante foi retido em Escrow. Um canal de chat real-time privado foi inaugurado.');
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao aceitar a proposta.');
    }
  };

  // Escrow actions: release or refund
  const handleEscrowAction = async (payment: Payment, action: 'release' | 'refund') => {
    const actionLabel = action === 'release' ? 'Liberar pagamento para o Dev' : 'Reembolsar montante para o Cliente';
    const confirmAction = window.confirm(`Você tem certeza que deseja executar a ação de Escrow: [${actionLabel}] no valor de ${formatMoney(payment.amount, payment.currency || 'Kz')}?`);
    if (!confirmAction) return;

    try {
      const statusValue = action === 'release' ? 'released' : 'refunded';
      await updateDoc(doc(db, 'payments', payment.id), { escrow_status: statusValue });

      // Update project status as completed or open depending on resolution
      const projRef = doc(db, 'projects', payment.project_id);
      await updateDoc(projRef, { status: action === 'release' ? 'completed' : 'open' });

      // Re-add reputation points to freelancer for clean delivery
      if (action === 'release') {
        const devRef = doc(db, 'users', payment.freelancer_id);
        const devSnap = await getDoc(devRef);
        if (devSnap.exists()) {
          const currentRepVal = devSnap.data().reputation || 100;
          await updateDoc(devRef, { reputation: currentRepVal + 15 });
        }
      }

      alert('Ação realizada com sucesso! Fluxo de custódia finalizado.');
    } catch (err) {
      console.error('Escrow trigger error:', err);
      alert('Ocorreu um erro ao intermediar a liberação de escrow.');
    }
  };

  // Submit setting updates
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await updateUserProfile({ bio: profileBio });
      
      const skillsArray = profileSkills.split(',').map(s => s.trim()).filter(Boolean);
      await updateDevProfile(
        profilePortfolio,
        skillsArray,
        profileExperience,
        profileGithub,
        profileLinkedin
      );

      alert('Configurações de perfil atualizadas com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar seu perfil.');
    }
  };

  // Custom visual PDF contract and invoice report markup
  const triggerDocExporter = (type: 'contract' | 'invoice' | 'receipt', payload: any) => {
    setShowDocExporter({ type, payload });
  };

  // Filter Jobs feed
  const activeOpenJobs = allProjects.filter(p => {
    const isAvailable = p.status === 'open';
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return isAvailable && matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-screen">
      
      {/* Top Welcome Panel with toggle capabilities */}
      <div className="bg-gray-950 border border-gray-900 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl shadow-gray-950/20">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-teal-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Espaço de Trabalho</span>
          </div>
          <h1 className="text-2xl md:text-3.5xl font-display font-extrabold text-white">
            Preparamos seu Painel, {user?.name}
          </h1>
          <p className="text-sm text-gray-400 max-w-xl">
            Visualize propostas de desenvolvedores, crie projetos e gerencie seus contratos em escrow perfeitamente.
          </p>
        </div>

        {/* Temporary simulation toggle between Client and Freelancer space */}
        <div className="flex flex-col gap-2 bg-gray-900 border border-gray-800 p-2 rounded-2xl w-full md:w-auto">
          <span className="text-[10px] font-mono uppercase text-gray-500 font-extrabold px-1 tracking-wider text-center">Modo de Visibilidade Avançado</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => { setIsRoleToggle('freelancer'); setActiveTab('explore-jobs'); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all select-none cursor-pointer ${
                isRoleToggle === 'freelancer' 
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-950/30' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sou Developer
            </button>
            <button
              onClick={() => { setIsRoleToggle('client'); setActiveTab('my-projects'); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all select-none cursor-pointer ${
                isRoleToggle === 'client' 
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-950/30' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sou Cliente
            </button>
          </div>
        </div>
      </div>

      {/* Main workspace splits */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar Drawer */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-gray-950 border border-gray-900 rounded-3xl p-4 shadow-md space-y-2">
            <span className="text-[10px] font-mono text-gray-500 font-extrabold px-3 uppercase tracking-widest">Navegação Integrada</span>
            
            <nav className="space-y-1">
              {isRoleToggle === 'client' ? (
                <>
                  <button
                    onClick={() => setActiveTab('my-projects')}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      activeTab === 'my-projects' 
                        ? 'bg-teal-950/40 text-teal-300 border-l-3 border-teal-500' 
                        : 'text-gray-400 hover:bg-gray-900/40 hover:text-gray-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Meus Projetos
                    </span>
                    <span className="bg-gray-900 border border-gray-800 text-gray-400 text-xs font-mono font-bold px-2 py-0.5 rounded-full">{clientProjects.length}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('explore-jobs')}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      activeTab === 'explore-jobs' 
                        ? 'bg-teal-950/40 text-teal-300 border-l-3 border-teal-500' 
                        : 'text-gray-400 hover:bg-gray-900/40 hover:text-gray-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Buscar Projetos
                    </span>
                    <span className="bg-gray-900 border border-gray-800 text-gray-400 text-xs font-mono font-bold px-2 py-0.5 rounded-full">{activeOpenJobs.length}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('bids')}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      activeTab === 'bids' 
                        ? 'bg-teal-950/40 text-teal-300 border-l-3 border-teal-500' 
                        : 'text-gray-400 hover:bg-gray-900/40 hover:text-gray-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Minhas Propostas
                    </span>
                    <span className="bg-gray-900 border border-gray-800 text-gray-400 text-xs font-mono font-bold px-2 py-0.5 rounded-full">{freelancerProposals.length}</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setActiveTab('escrow')}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'escrow' 
                    ? 'bg-teal-950/40 text-teal-300 border-l-3 border-teal-500' 
                    : 'text-gray-400 hover:bg-gray-900/40 hover:text-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Escrow & Saldos
                </span>
                <span className="bg-teal-950/30 border border-teal-900 text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{payments.length}</span>
              </button>

              <button
                onClick={() => setActiveTab('profile-settings')}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'profile-settings' 
                    ? 'bg-teal-950/40 text-teal-300 border-l-3 border-teal-500' 
                    : 'text-gray-400 hover:bg-gray-900/40 hover:text-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Editar Perfil / Skills
                </span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </nav>
          </div>

          {/* Quick Realtime Active Chat channels list widget */}
          <div className="bg-gray-950 border border-gray-900 rounded-3xl p-4 shadow-md space-y-3">
            <span className="text-[10px] font-mono text-gray-500 font-extrabold px-1 uppercase tracking-widest block">Canais Ativos Chat</span>
            {activeChats.length === 0 ? (
              <p className="text-xs text-gray-500 px-1 py-2">Feche uma proposta para obter chats integrados real-time.</p>
            ) : (
              <div className="space-y-1.5">
                {activeChats.map(c => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/profile/${user?.id}`)} // Redirect user or let user know we have fully featured direct chat in dashboard page or user profiles
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-gray-900/60 group transition-colors"
                  >
                    <div className="bg-teal-950/40 p-2 rounded-lg text-teal-400 border border-teal-900 group-hover:bg-teal-900/40">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="truncate text-xs">
                      <div className="font-semibold text-gray-200 truncate">{c.project_title}</div>
                      <div className="text-[10px] text-gray-400 font-mono italic">Conversa: {user?.role === 'client' ? c.freelancer_name : c.client_name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Dynamic Area Workspace content */}
        <main className="lg:col-span-3 space-y-6">

          {/* Tab 1 FOR CLIENTS: My posted jobs queue & create jobs */}
          {activeTab === 'my-projects' && isRoleToggle === 'client' && (
            <div className="space-y-6">
              
              {/* Job Posting Form */}
              <div className="bg-gray-950 border border-gray-900 rounded-3xl p-6 shadow-md space-y-5">
                <div className="flex items-center gap-2 border-b border-gray-900 pb-3">
                  <PlusCircle className="w-5 h-5 text-teal-400" />
                  <h2 className="font-display font-bold text-lg text-white">Publicar Novo Projeto Freelance</h2>
                </div>

                <form onSubmit={handlePostProject} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <label className="text-xs text-gray-300 font-semibold">Título do Job *</label>
                    <input
                      type="text"
                      placeholder="Ex: Desenvolvimento de E-commerce com React + Supabase"
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm text-gray-200 outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-300 font-semibold">Categoria Técnica *</label>
                    <select
                      value={postCategory}
                      onChange={(e) => setPostCategory(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm text-gray-200 outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="Desenvolvimento">Desenvolvimento Full Stack</option>
                      <option value="Design">UI/UX Design</option>
                      <option value="Edição">Edição de Vídeo</option>
                      <option value="Especialista SaaS">Especialista SaaS / API</option>
                      <option value="Marketing">Marketing Digital</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-300 font-semibold">Moeda & Orçamento Máximo *</label>
                    <div className="flex gap-2">
                      <select
                        value={postCurrency}
                        onChange={(e) => setPostCurrency(e.target.value as any)}
                        className="bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-2 text-sm text-gray-200 outline-none focus:border-teal-500 cursor-pointer w-28 shrink-0"
                      >
                        <option value="Kz">Angola (Kz)</option>
                        <option value="R$">Brasil (R$)</option>
                        <option value="USD">América (USD)</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Ex: 5000"
                        value={postBudget}
                        onChange={(e) => setPostBudget(e.target.value)}
                        className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm text-gray-200 outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-xs text-gray-300 font-semibold">Prazo Estimado de Entrega (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: 30 dias, A Combinar"
                      value={postDeadline}
                      onChange={(e) => setPostDeadline(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm text-gray-200 outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <label className="text-xs text-gray-300 font-semibold">Descrição do Escopo e Linguagens Exigidas *</label>
                    <textarea
                      placeholder="Detalhamento técnico completo sobre o projeto..."
                      rows={4}
                      value={postDesc}
                      onChange={(e) => setPostDesc(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm text-gray-200 outline-none focus:border-teal-500 resize-none"
                    ></textarea>
                  </div>

                  <div className="col-span-1 md:col-span-2 pt-2">
                    <button
                      type="submit"
                      className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                      Publicar Projeto na Plataforma
                    </button>
                  </div>
                </form>
              </div>

              {/* Client Job Queue */}
              <div className="bg-gray-950 border border-gray-900 rounded-3xl p-6 shadow-md space-y-4">
                <h3 className="font-display font-bold text-lg text-gray-200">Seus Projetos Ativos</h3>
                {clientProjects.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhum projeto publicado ainda. Use o formulário acima para postar.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {clientProjects.map(proj => (
                      <div key={proj.id} className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gray-750 transition-colors">
                        <div className="space-y-1 max-w-md">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-teal-400 bg-teal-950/30 px-2 py-0.5 rounded-full border border-teal-900">{proj.category}</span>
                            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                              proj.status === 'open' ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400' :
                              proj.status === 'active' ? 'bg-sky-950/30 border-sky-900 text-sky-400' : 'bg-gray-800 border-gray-750 text-gray-400'
                            }`}>{proj.status}</span>
                          </div>
                          <h4 className="font-display font-semibold text-white text-base">{proj.title}</h4>
                          <p className="text-xs text-gray-400 line-clamp-1 italic">{proj.description}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 md:self-center">
                          <div className="text-right mr-2">
                            <div className="text-[10px] text-gray-500 uppercase font-mono">Orçamento</div>
                            <div className="text-sm font-extrabold text-teal-300">{formatMoney(proj.budget, proj.currency)}</div>
                          </div>
                          
                          {proj.status === 'open' && (
                            <button
                              onClick={() => setSelectedProject(proj)}
                              className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                            >
                              Ver Propostas
                            </button>
                          )}

                          {proj.status === 'active' && (
                            <button
                              onClick={() => {
                                const relPayment = payments.find(p => p.project_id === proj.id && p.escrow_status === 'held');
                                if (relPayment) {
                                  handleEscrowAction(relPayment, 'release');
                                } else {
                                  alert('O saldo deste projeto já foi liberado ou reembolsado.');
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                            >
                              Liberar Escrow
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Tab 2 FOR FREELANCERS / VISITOR: Job seeker/explorer list */}
          {activeTab === 'explore-jobs' && (
            <div className="bg-gray-950 border border-gray-900 rounded-3xl p-6 shadow-md space-y-6">
              <div className="space-y-1">
                <h2 className="font-display font-extrabold text-xl text-white">Buscar Jobs Técnicos</h2>
                <p className="text-sm text-gray-400">Selecione projetos abertos e envie propostas técnicas inteligentes para os clientes.</p>
              </div>

              {/* Feed Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Filtre por termo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-200 outline-none focus:border-teal-500"
                />

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-200 outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="All">Todas as Categorias</option>
                  <option value="Desenvolvimento">Desenvolvimento Full Stack</option>
                  <option value="Design">UI/UX Design</option>
                  <option value="Edição">Edição de Vídeo</option>
                  <option value="Especialista SaaS">Especialista SaaS / API</option>
                  <option value="Marketing">Marketing Digital</option>
                </select>
              </div>

              {/* Jobs Queue */}
              {activeOpenJobs.length === 0 ? (
                <div className="text-center py-10 bg-gray-900/10 border border-gray-900 rounded-2xl">
                  <p className="text-gray-400 text-sm">Nenhum projeto livre correspondente no momento.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeOpenJobs.map(proj => (
                    <div key={proj.id} className="bg-gray-900/60 border border-gray-800/80 p-5 rounded-2xl hover:border-gray-700 transition-colors space-y-4">
                      
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase tracking-wider font-mono font-extrabold text-teal-400">{proj.category}</span>
                          <h3 className="font-display font-bold text-lg text-white">{proj.title}</h3>
                          <div className="text-[10px] text-gray-500 font-mono">Publicado por {proj.client_name} • Prazo: {proj.deadline}</div>
                        </div>
                        <div className="bg-teal-950/30 border border-teal-800/40 text-teal-300 font-bold px-3 py-1.5 rounded-xl text-xs font-mono">
                          {formatMoney(proj.budget, proj.currency)}
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">{proj.description}</p>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => {
                            if (!user) {
                              alert('Faça cadastro/login para enviar uma proposta!');
                              return;
                            }
                            if (!user.verified) {
                              alert('Sua conta precisa ser verificada por um administrador antes de dar lances.');
                              return;
                            }
                            setSelectedProject(proj);
                          }}
                          className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                        >
                          Enviar Orçamento / Proposta
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Freelancer Bids Queue */}
          {activeTab === 'bids' && isRoleToggle === 'freelancer' && (
            <div className="bg-gray-950 border border-gray-900 rounded-3xl p-6 shadow-md space-y-6">
              <h2 className="font-display font-extrabold text-xl text-white">Propostas Enviadas</h2>
              
              {freelancerProposals.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma proposta enviada. Use a busca de jobs para enviar propostas.</p>
              ) : (
                <div className="space-y-4">
                  {freelancerProposals.map(bid => (
                    <div key={bid.id} className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <h4 className="font-display font-bold text-base text-gray-200">{bid.project_title}</h4>
                        <p className="text-xs text-gray-400 italic">"Sua mensagem: {bid.message}"</p>
                        <div className="text-[10px] text-gray-500 font-mono">Prazo Estimado: {bid.deadline} | Enviado em: {new Date(bid.created_at).toLocaleDateString()}</div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[10px] text-gray-500 font-mono">Preço Ofertado</div>
                          <div className="text-sm font-bold text-teal-300">{formatMoney(bid.price, bid.currency || 'Kz')}</div>
                        </div>

                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          bid.status === 'accepted' ? 'bg-teal-950/40 border-teal-800 text-teal-400' :
                          bid.status === 'rejected' ? 'bg-red-950/40 border-red-900 text-red-400' : 'bg-amber-950/20 border-amber-800/60 text-amber-500'
                        }`}>{bid.status === 'accepted' ? 'Contratado' : bid.status === 'rejected' ? 'Recusado' : 'Pendente'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Escrow & Payout Details */}
          {activeTab === 'escrow' && (
            <div className="space-y-6">
              <div className="bg-gray-950 border border-gray-900 rounded-3xl p-6 shadow-md space-y-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <h2 className="font-display font-extrabold text-xl text-white">Saldos & Custódias Escrow</h2>
                    <p className="text-xs text-gray-400">Total de fundos sob tutela de segurança de arbitragem Konda Tech.</p>
                  </div>

                  <div className="bg-gray-900 border border-gray-800 px-6 py-4 rounded-2xl flex flex-col sm:flex-row gap-4 sm:gap-6 text-center sm:text-left">
                    <div>
                      <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Kwanza Angola (Kz)</div>
                      <div className="text-xl font-extrabold text-teal-300">
                        {formatMoney(payments.reduce((acc, curr) => (curr.escrow_status === 'held' && (curr.currency === 'Kz' || !curr.currency)) ? acc + curr.amount : acc, 0), 'Kz')}
                      </div>
                    </div>
                    <div className="border-t sm:border-t-0 sm:border-l border-gray-800 pt-2 sm:pt-0 sm:pl-6">
                      <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Real Brasil (R$)</div>
                      <div className="text-xl font-extrabold text-teal-300">
                        {formatMoney(payments.reduce((acc, curr) => (curr.escrow_status === 'held' && curr.currency === 'R$') ? acc + curr.amount : acc, 0), 'R$')}
                      </div>
                    </div>
                    <div className="border-t sm:border-t-0 sm:border-l border-gray-800 pt-2 sm:pt-0 sm:pl-6">
                      <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">USD América ($)</div>
                      <div className="text-xl font-extrabold text-teal-300">
                        {formatMoney(payments.reduce((acc, curr) => (curr.escrow_status === 'held' && curr.currency === 'USD') ? acc + curr.amount : acc, 0), 'USD')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payments History Register */}
              <div className="bg-gray-950 border border-gray-900 rounded-3xl p-6 shadow-md space-y-4">
                <h3 className="font-display font-bold text-base text-gray-200">Histórico de Transações do Painel</h3>
                
                {payments.length === 0 ? (
                  <p className="text-sm text-gray-400">Não há transações concluídas ou ativas neste perfil.</p>
                ) : (
                  <div className="space-y-4">
                    {payments.map(pay => (
                      <div key={pay.id} className="bg-gray-905 border border-gray-800 p-5 rounded-2xl flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-4">
                          <div className="space-y-1">
                            <h4 className="font-display font-bold text-sm text-white">{pay.project_title}</h4>
                            <p className="text-xs text-gray-400 flex items-center gap-1 text-[11px]">
                              <span>ID da Transação: <strong>{pay.id.slice(0, 8)}</strong></span>
                              <span>• Taxas Plataforma (10%): {formatMoney(pay.fee, pay.currency)}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-4 self-stretch md:self-auto justify-between">
                            <div className="text-left md:text-right">
                              <span className="text-[10px] text-gray-500 font-mono block">Valor Líquido</span>
                              <span className="text-sm font-bold text-teal-300">{formatMoney(pay.freelancer_amount, pay.currency)}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-mono font-bold uppercase px-2 py-1 rounded-lg border ${
                                pay.escrow_status === 'held' ? 'bg-amber-950/20 border-amber-800 text-amber-500' :
                                pay.escrow_status === 'released' ? 'bg-teal-950/30 border-teal-800 text-teal-400' : 'bg-red-950/20 border-red-900 text-red-400'
                              }`}>{pay.escrow_status === 'held' ? 'Em Custódia' : pay.escrow_status === 'released' ? 'Pago' : 'Reembolsado'}</span>

                              {/* Option to generate beautiful Contract PDF Report */}
                              <button
                                onClick={() => triggerDocExporter('contract', pay)}
                                className="bg-gray-800 hover:bg-gray-700 hover:text-white border border-gray-750 text-gray-300 rounded-lg p-2 transition-colors cursor-pointer"
                                title="Exportar Relatório PDF / Contrato Comercial"
                              >
                                <FileCheck className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Interactive proof of transaction block (Comprovante / WhatsApp / Gateway) */}
                        {pay.escrow_status === 'held' && (
                          <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-gray-300 block">Enviar Fundos de Garantia (Escrow)</span>
                                <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 gap-1">
                                  <button
                                    onClick={async () => {
                                      await updateDoc(doc(db, 'payments', pay.id), { payment_method: 'gateway' });
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      (pay.payment_method || 'gateway') === 'gateway'
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                                  >
                                    Gateway Integrado
                                  </button>
                                  <button
                                    onClick={async () => {
                                      await updateDoc(doc(db, 'payments', pay.id), { payment_method: 'manual' });
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      pay.payment_method === 'manual'
                                        ? 'bg-amber-600 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                                  >
                                    WhatsApp / Comprovante Manual
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {(pay.payment_method || 'gateway') === 'gateway' ? (
                                  <button
                                    onClick={() => {
                                      alert(`Gateway de Pagamento: O valor de ${formatMoney(pay.amount, pay.currency || 'Kz')} foi creditado imediatamente em custódia segura via API de gateway!\n\nEstes fundos ficarão protegidos no Escrow até a entrega do projeto pelo freelancer.`);
                                    }}
                                    className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow shadow-teal-950/20"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    Pagar Agora (Simulação Gateway)
                                  </button>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    <a
                                      href={`https://wa.me/244999999999?text=Olá! Segue o comprovante de pagamento efetuado para o projeto [${pay.project_title}] no valor de ${formatMoney(pay.amount, pay.currency || 'Kz')}.`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow shadow-emerald-950/25"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      WhatsApp (Mandar Recibo)
                                    </a>
                                    <label className="bg-gray-800 hover:bg-gray-700 text-gray-250 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-gray-750">
                                      <Plus className="w-3.5 h-3.5" />
                                      Anexar Recibo
                                      <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const simulatedUrl = `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`;
                                            await updateDoc(doc(db, 'payments', pay.id), {
                                              receipt_url: simulatedUrl,
                                              receipt_name: file.name,
                                              receipt_uploaded_at: new Date().toISOString(),
                                              receipt_confirmed: false
                                            });
                                            alert(`Comprovante de recebimento "${file.name}" anexado à transação!`);
                                          }
                                        }}
                                      />
                                    </label>
                                  </div>
                                )}
                              </div>
                            </div>

                            {pay.receipt_name && (
                              <div className="bg-gray-950/60 border border-amber-900/35 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono text-amber-500 font-bold uppercase tracking-wider block">Recibo Enviado em Anexo</span>
                                  <p className="text-xs text-gray-200 font-bold flex flex-wrap items-center gap-1.5">
                                    <span className="underline cursor-pointer hover:text-teal-400" onClick={() => window.open(pay.receipt_url, '_blank')}>
                                      {pay.receipt_name}
                                    </span>
                                    <span className="text-gray-500 font-normal font-mono text-[9px]">({new Date(pay.receipt_uploaded_at!).toLocaleDateString()} ás {new Date(pay.receipt_uploaded_at!).toLocaleTimeString()})</span>
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  {pay.receipt_confirmed ? (
                                    <span className="bg-teal-950/30 border border-teal-900 text-teal-400 font-bold px-2.5 py-1 rounded-lg text-[9px] flex items-center gap-1 uppercase font-mono">
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      Recibo Confirmado pelo Prestador ✓
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="bg-amber-950/20 border border-amber-905/60 text-amber-500 font-bold px-2.5 py-1 rounded-lg text-[9px] uppercase font-mono">
                                        Pendente de Validação
                                      </span>
                                      {user.role === 'freelancer' && user.id === pay.freelancer_id && (
                                        <button
                                          onClick={async () => {
                                            const confirmReceived = window.confirm(`Você confirma o recebimento do valor de ${formatMoney(pay.amount, pay.currency || 'Kz')} correspondente a este recibo enviado no chat/WhatsApp?`);
                                            if (confirmReceived) {
                                              await updateDoc(doc(db, 'payments', pay.id), { receipt_confirmed: true });
                                              alert('Recibo confirmado com sucesso!');
                                            }
                                          }}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                        >
                                          Confirmar Recebimento de Valor
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 5: Profile settings */}
          {activeTab === 'profile-settings' && (
            <div className="bg-gray-950 border border-gray-900 rounded-3xl p-6 shadow-md space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-900 pb-3">
                <Settings className="w-5 h-5 text-teal-400" />
                <h2 className="font-display font-bold text-lg text-white font-display">Configurações de Credenciais & Perfil</h2>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-xs text-gray-300 font-semibold">Minha Biografia Exclusiva</label>
                    <textarea
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      rows={2}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-200 outline-none focus:border-teal-500"
                    />
                  </div>

                  {user?.role !== 'client' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-300 font-semibold">Skills Técnicas (Separadas por vírgula)</label>
                        <input
                          type="text"
                          value={profileSkills}
                          onChange={(e) => setProfileSkills(e.target.value)}
                          placeholder="React, TypeScript, Node.js"
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-200 outline-none focus:border-teal-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-300 font-semibold">Anos de Experiência / Nível Profissional</label>
                        <input
                          type="text"
                          value={profileExperience}
                          onChange={(e) => setProfileExperience(e.target.value)}
                          placeholder="Senior Full Stack, Tech Lead, 5 anos"
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-200 outline-none focus:border-teal-500"
                        />
                      </div>

                      <div className="space-y-1.5 col-span-1 md:col-span-2">
                        <label className="text-xs text-gray-300 font-semibold font-display">Descrição Profissional / Detalhamento de Portfólio</label>
                        <textarea
                          value={profilePortfolio}
                          onChange={(e) => setProfilePortfolio(e.target.value)}
                          rows={4}
                          placeholder="Apresente detalhadamente as soluções que você desenvolve..."
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-200 outline-none focus:border-teal-500 resize-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-300 font-semibold">Endereço de GitHub</label>
                        <input
                          type="text"
                          value={profileGithub}
                          onChange={(e) => setProfileGithub(e.target.value)}
                          placeholder="https://github.com/exemplo"
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-200 outline-none focus:border-teal-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-300 font-semibold">Endereço de LinkedIn</label>
                        <input
                          type="text"
                          value={profileLinkedin}
                          onChange={(e) => setProfileLinkedin(e.target.value)}
                          placeholder="https://linkedin.com/in/exemplo"
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-200 outline-none focus:border-teal-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Salvar Alterações do Perfil
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* MODAL 1: Bid/Proposal submission form modal for freelancers */}
      {selectedProject && isRoleToggle === 'freelancer' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-xl w-full space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-850 pb-3">
              <div>
                <span className="text-[9px] font-mono text-teal-400 uppercase tracking-wider block font-bold">Enviar Proposta Comercial</span>
                <h3 className="font-display font-extrabold text-base text-white">{selectedProject.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedProject(null)}
                className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBid} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 font-display">
                  <label className="text-[11px] text-gray-400 font-semibold">Valor Proposto ({selectedProject.currency || 'Kz'}) *</label>
                  <input
                    type="number"
                    required
                    value={bidPrice}
                    onChange={(e) => setBidPrice(e.target.value)}
                    placeholder="Ex: 4500"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 outline-none focus:border-teal-500"
                  />
                  <span className="text-[9px] text-gray-500 block font-mono">Líquido (menos 10% de faturamento): {formatMoney(parseFloat(bidPrice) ? parseFloat(bidPrice) * 0.9 : 0, selectedProject.currency || 'Kz')}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400 font-semibold">Prazo de Entrega Estimado *</label>
                  <input
                    type="text"
                    required
                    value={bidDeadline}
                    onChange={(e) => setBidDeadline(e.target.value)}
                    placeholder="Ex: 15 dias"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-gray-400 font-semibold">Descrição Técnica da sua Proposta *</label>
                <textarea
                  required
                  rows={4}
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  placeholder="Detalhamento técnico das entregas, linguagens, escopo e prazos intermediários..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Oficializar e Enviar Proposta para o Cliente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Client inspects job proposals */}
      {selectedProject && isRoleToggle === 'client' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-2xl w-full space-y-5 animate-in fade-in zoom-in duration-200 object-contain max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-850 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-teal-400">Propostas Recebidas</span>
                <h3 className="font-display font-extrabold text-white text-base truncate max-w-md">{selectedProject.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedProject(null)}
                className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {projectProposals.length === 0 ? (
              <p className="text-center py-10 text-gray-500 text-sm italic">Nenhuma proposta recebida para este projeto até o momento.</p>
            ) : (
              <div className="space-y-4">
                {projectProposals.map(bid => (
                  <div key={bid.id} className="bg-gray-950 border border-gray-850 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center gap-4">
                      
                      <div className="flex items-center gap-2.5">
                        <img src={bid.freelancer_avatar} alt={bid.freelancer_name} className="w-9 h-9 rounded-full object-cover" />
                        <div>
                          <div className="text-sm font-bold text-gray-200">{bid.freelancer_name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">Prazo Estimado: {bid.deadline}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-gray-500 font-mono uppercase">Orçamento</div>
                        <div className="text-sm font-bold text-teal-300">{formatMoney(bid.price, bid.currency || 'Kz')}</div>
                      </div>

                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed bg-gray-900 p-3 rounded-xl">{bid.message}</p>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleAcceptProposal(bid)}
                        className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow shadow-teal-950/20"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Aceitar Proposta e Iniciar Escrow
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: High Fidelity Vector contract and invoice generator overlay */}
      {showDocExporter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
          <div className="bg-white text-gray-950 p-8 rounded-3xl max-w-2xl w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowDocExporter(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-950 p-1 rounded-full hover:bg-gray-100 cursor-pointer print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Document Vector printable area */}
            <div id="print-area" className="space-y-6 font-sans">
              
              <div className="flex justify-between items-start border-b-2 border-gray-900 pb-5">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">KONDA TECH</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Plataforma Certificada de Escrow</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold px-2 py-1 bg-gray-100 rounded text-gray-700">DOCUMENTO DE TRANSAÇÃO</div>
                  <div className="text-[10px] text-gray-500 mt-1 font-mono">Ref: KON-{showDocExporter.payload.id.slice(0, 8).toUpperCase()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-bold text-gray-650 uppercase tracking-wider text-[10px] font-mono">CONTRATANTE (CLIENTE)</div>
                  <div className="font-semibold text-gray-900 mt-0.5">ID: {showDocExporter.payload.client_id.slice(0, 10)}</div>
                  <div className="text-gray-500">Konda Tech Client ID</div>
                </div>
                <div>
                  <div className="font-bold text-gray-650 uppercase tracking-wider text-[10px] font-mono">CONTRATADO (DEVELOPER)</div>
                  <div className="font-semibold text-gray-900 mt-0.5">ID: {showDocExporter.payload.freelancer_id.slice(0, 10)}</div>
                  <div className="text-gray-500">Konda Tech Freelancer ID</div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-4">
                <div className="border-b border-gray-200 pb-2">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Objeto Técnico</span>
                  <div className="text-sm font-bold text-gray-900 leading-snug">{showDocExporter.payload.project_title}</div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-[10px] text-gray-500 font-mono">VALOR BRUTO</div>
                    <div className="text-sm font-bold text-gray-900">{formatMoney(showDocExporter.payload.amount, showDocExporter.payload.currency)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 font-mono">TAXA PLATAFORMA</div>
                    <div className="text-sm font-bold text-amber-600">{formatMoney(showDocExporter.payload.fee, showDocExporter.payload.currency)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 font-mono">LÍQUIDO LIBERADO</div>
                    <div className="text-sm font-bold text-teal-600">{formatMoney(showDocExporter.payload.freelancer_amount, showDocExporter.payload.currency)}</div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 space-y-1 bg-yellow-50/50 border border-yellow-250 p-4 rounded-xl">
                <p className="font-bold text-gray-800 flex items-center gap-1 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  DECLARAÇÃO DE CLÁUSULAS ESCROW (KONDA SECURE):
                </p>
                <p>1. Os presentes fundos foram integralmente custodiados sob o protocolo de Escrow da Konda Tech.</p>
                <p>2. A liberação do saldo para o profissional técnico é irrevogável após a autorização manual do cliente contratante.</p>
                <p>3. Eventuais arbitragens em disputas estão sob competência exclusiva do colegiado administrativo do ecossistema.</p>
              </div>

              <div className="flex justify-between items-end border-t border-gray-200 pt-6 text-[10px] font-mono text-gray-500">
                <div>
                  Plataforma Digital Konda Tech<br />
                  Registrado em: {new Date(showDocExporter.payload.created_at).toLocaleDateString()}
                </div>
                <div className="text-right">
                  Chave Assinatura Privada:<br />
                  <span className="text-xs font-bold text-gray-800 tracking-wider">SEC___{showDocExporter.payload.id.substring(0, 12)}</span>
                </div>
              </div>

            </div>

            <div className="mt-8 flex justify-end gap-3 print:hidden">
              <button 
                onClick={() => window.print()}
                className="bg-gray-950 hover:bg-gray-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Imprimir / Comprovante PDF Vector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
