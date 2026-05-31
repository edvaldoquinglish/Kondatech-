import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Project, User } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Search, 
  Terminal, 
  DollarSign, 
  UserCheck, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Layers,
  Star
} from 'lucide-react';

interface LandingPageProps {
  onOpenPhoneAuth: (isSignUp: boolean) => void;
}

export function LandingPage({ onOpenPhoneAuth }: LandingPageProps) {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [freelancers, setFreelancers] = useState<User[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch some public active projects and top verified devs for showcases
  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        // Fetch Projects
        const projSnap = await getDocs(query(collection(db, 'projects'), orderBy('created_at', 'desc'), limit(10)));
        const fetchedProjs: Project[] = [];
        projSnap.forEach((doc) => {
          fetchedProjs.push({ id: doc.id, ...doc.data() } as Project);
        });
        setProjects(fetchedProjs);

        // Fetch Freelancers
        const devSnap = await getDocs(query(collection(db, 'users'), where('role', 'in', ['freelancer', 'admin']), limit(12)));
        const fetchedDevs: User[] = [];
        devSnap.forEach((doc) => {
          const ud = doc.data() as User;
          // Show only verified or high status
          fetchedDevs.push({ id: doc.id, ...ud });
        });
        setFreelancers(fetchedDevs);
      } catch (err) {
        console.error('Error loading landing page collections:', err);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchLandingData();
  }, []);

  const handleStartWork = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      // Prompt Sign Up
      onOpenPhoneAuth(true);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', 'Desenvolvimento', 'Design', 'Edição', 'Especialista SaaS', 'Marketing'];

  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-center border-b border-gray-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-950/20 via-gray-950 to-gray-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
        
        <div className="relative max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-teal-950/40 border border-teal-800/80 px-4 py-1.5 rounded-full text-xs text-teal-400 font-semibold animate-bounce">
            <Sparkles className="w-4 h-4" />
            <span>A melhor plataforma SaaS de Escrow Freelancer do país</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-white leading-tight">
            Conecte-se com <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-sky-400 bg-clip-text text-transparent">Elite de Desenvolvedores</span>, Freelancers e Projetos de Sucesso.
          </h1>

          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Konda Tech é um ecossistema seguro com garantias financeiras por <span className="text-teal-400 font-medium">Contrato Escrow</span>. Clientes descrevem trabalhos, talentos enviam propostas e pagamentos só são liberados mediante entrega comprovada.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white font-semibold text-base px-8 py-3.5 rounded-xl shadow-lg shadow-teal-950/30 transform hover:scale-[1.02] transition-all"
              >
                Ir para o Painel de Trabalho
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <button
                  onClick={handleGoogleLogin}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white text-gray-900 border border-gray-200 hover:bg-gray-100 font-semibold text-sm px-6 py-3.5 rounded-xl transition-colors cursor-pointer"
                >
                  <Terminal className="w-4 h-4 text-emerald-600" />
                  Cadastrar como Freelancer (Google)
                </button>
                <button
                  onClick={() => onOpenPhoneAuth(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Cadastrar como Cliente (Celular)
                  <Briefcase className="w-4 h-4" />
                </button>
              </>
            )}
            <a
              href="#projects"
              className="text-gray-400 hover:text-white text-sm font-semibold flex items-center gap-1 hover:underline px-4 py-2"
            >
              Explorar Projetos Públicos
            </a>
          </div>
        </div>

        {/* Highlight pillars */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-16 relative z-10 text-left">
          <div className="bg-gray-900/60 border border-gray-800 p-5 rounded-2xl flex items-start gap-4">
            <div className="bg-teal-950/40 p-3 rounded-xl border border-teal-800/40 text-teal-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-white">Garantia Escrow</h3>
              <p className="text-xs text-gray-400 mt-1">O saldo do projeto fica retido em custódia segura até que as partes aprovem as entregas.</p>
            </div>
          </div>
          
          <div className="bg-gray-900/60 border border-gray-800 p-5 rounded-2xl flex items-start gap-4">
            <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/40 text-emerald-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-white">KYC Verificação</h3>
              <p className="text-xs text-gray-400 mt-1">Administradores revisam identidades e portfólios manualmente para assegurar idoneidade.</p>
            </div>
          </div>

          <div className="bg-gray-900/60 border border-gray-800 p-5 rounded-2xl flex items-start gap-4">
            <div className="bg-sky-950/40 p-3 rounded-xl border border-sky-800/40 text-sky-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-white">Taxas Claras</h3>
              <p className="text-xs text-gray-400 mt-1">Taxas planas de apenas 10% do valor total das propostas aceitas. Sem taxas escondidas.</p>
            </div>
          </div>

          <div className="bg-gray-900/60 border border-gray-800 p-5 rounded-2xl flex items-start gap-4">
            <div className="bg-violet-950/40 p-3 rounded-xl border border-violet-800/40 text-violet-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-white">Reputação Dinâmica</h3>
              <p className="text-xs text-gray-400 mt-1">Sistema integrado que bonifica membros de boa convicção e resolve disputas rapidamente.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Public Projects List Section */}
      <section id="projects" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-900 pb-6">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
              Explorar Oportunidades
            </h2>
            <p className="text-sm text-gray-400">
              Projetos abertos para envio de propostas por profissionais verificados.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por projetos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 focus:border-teal-500 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-100 outline-none placeholder-gray-500"
            />
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold select-none cursor-pointer transition-all ${
                selectedCategory === cat 
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-900/20' 
                  : 'bg-gray-950 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading / Content Grid */}
        {loadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-gray-900/40 border border-gray-800 rounded-2xl h-48 animate-pulse"></div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/20 border border-gray-900 rounded-2xl flex flex-col items-center gap-2">
            <Briefcase className="w-10 h-10 text-gray-600" />
            <p className="text-gray-400 text-sm">Nenhum projeto encontrado nesta categoria.</p>
            {user?.role === 'client' && (
              <Link to="/dashboard" className="text-xs text-teal-400 hover:underline font-semibold mt-2">
                Publique seu primeiro projeto agora mesmo &rarr;
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((p) => (
              <div key={p.id} className="bg-gray-950 border border-gray-900 hover:border-gray-800/80 rounded-2xl p-6 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-950/40 relative group">
                <div className="absolute top-4 right-4 bg-teal-950/30 border border-teal-800/40 text-teal-400 px-3 py-1 rounded-full text-xs font-mono font-bold">
                  R$ {p.budget.toLocaleString('pt-BR')}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-mono font-extrabold text-teal-400">{p.category}</span>
                    <h3 className="font-display font-bold text-lg text-white group-hover:text-teal-300 transition-colors line-clamp-1">{p.title}</h3>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{p.description}</p>
                </div>

                <div className="border-t border-gray-900/60 mt-6 pt-4 flex justify-between items-center text-xs">
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase font-mono tracking-wider">Cliente</div>
                    <div className="text-gray-300 font-medium">{p.client_name}</div>
                  </div>

                  <Link 
                    to={user ? `/dashboard?proj=${p.id}` : '#'}
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault();
                        onOpenPhoneAuth(false);
                      }
                    }}
                    className="flex items-center gap-1 font-semibold text-teal-400 hover:text-teal-300 hover:underline transition-colors cursor-pointer"
                  >
                    {user ? 'Ver e Licitar' : 'Logar para Licitar'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Top Verified Freelancers List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="border-b border-gray-900 pb-6">
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            Talentos Verificados
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Profissionais digitais aprovados para trabalhar com garantias e segurança em nossa comunidade.
          </p>
        </div>

        {freelancers.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            Nenhum prestador verificado registrado no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {freelancers.map((dev) => (
              <div key={dev.id} className="bg-gray-950 border border-gray-900 p-5 rounded-2xl flex flex-col justify-between hover:border-gray-800 transition-colors text-center relative">
                
                {dev.verified && (
                  <span className="absolute top-3 right-3 bg-teal-950/40 border border-teal-800/40 text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded-full hover:scale-105 duration-200 cursor-pointer">
                    Ativo KYC
                  </span>
                )}

                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full border-2 border-teal-500/10 overflow-hidden bg-gray-900 flex items-center justify-center p-0.5">
                    <img src={dev.avatar} alt={dev.name} className="w-full h-full rounded-full object-cover" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-sm text-white line-clamp-1">{dev.name}</h3>
                    <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-amber-400 font-mono">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{dev.reputation} Pontos</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-2 h-8 leading-relaxed italic">
                    "{dev.bio || 'Sem descrição.'}"
                  </p>
                </div>

                <div className="mt-6">
                  <Link 
                    to={`/profile/${dev.id}`}
                    className="block w-full text-center bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white transition-all text-xs font-semibold py-2.5 rounded-xl cursor-pointer"
                  >
                    Ver Perfil Profissional
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
