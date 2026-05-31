import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  onSnapshot,
  orderBy,
  setDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { User, Profile, Message, ChatRoom } from '../types';
import { 
  Star, 
  ShieldCheck, 
  Clock, 
  Github, 
  Linkedin, 
  FileText, 
  Send, 
  Paperclip,
  CheckCircle2, 
  ArrowLeft,
  Settings,
  MessageSquare,
  Lock,
  UserCheck,
  Building,
  Upload,
  X
} from 'lucide-react';

export function ProfileDetails() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, profile: currentProfile } = useAuth();
  const navigate = useNavigate();

  const [tgtUser, setTgtUser] = useState<User | null>(null);
  const [tgtProfile, setTgtProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Chat integration states
  const [activeChat, setActiveChat] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  // File Upload states (Simulation logs)
  const [uploadLog, setUploadLog] = useState<{ name: string; url: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch Target Profile details
  useEffect(() => {
    const fetchTargetData = async () => {
      if (!id) return;
      setLoading(true);
      
      try {
        // Find user by UID
        const userRef = doc(db, 'users', id);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setTgtUser({ id: userSnap.id, ...userSnap.data() } as User);
          
          // Fetch profile portfolio record
          const profSnap = await getDoc(doc(db, 'profiles', id));
          if (profSnap.exists()) {
            setTgtProfile(profSnap.data() as Profile);
          }
        } else {
          // Fallback, check if username param was passed instead
          const usersQuery = query(collection(db, 'users'), where('email', '==', id));
          const querySnap = await getDocs(usersQuery);
          if (!querySnap.empty) {
            const firstMatchedUser = querySnap.docs[0];
            setTgtUser({ id: firstMatchedUser.id, ...firstMatchedUser.data() } as User);

            const profSnap = await getDoc(doc(db, 'profiles', firstMatchedUser.id));
            if (profSnap.exists()) {
              setTgtProfile(profSnap.data() as Profile);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching target profile stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTargetData();
  }, [id]);

  // Open Chat Room for real-time messaging
  useEffect(() => {
    if (!currentUser || !tgtUser || currentUser.id === tgtUser.id) return;

    setLoadingChat(true);
    const pathChats = 'chats';
    
    // Find or construct chat room between current user and target user
    const chatsQuery = query(
      collection(db, pathChats), 
      where('client_id', 'in', [currentUser.id, tgtUser.id])
    );

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      let matchedRoom: ChatRoom | null = null;
      snapshot.forEach((doc) => {
        const room = { id: doc.id, ...doc.data() } as ChatRoom;
        if (
          (room.client_id === currentUser.id && room.freelancer_id === tgtUser.id) ||
          (room.client_id === tgtUser.id && room.freelancer_id === currentUser.id)
        ) {
          matchedRoom = room;
        }
      });

      if (matchedRoom) {
        setActiveChat(matchedRoom);
        setLoadingChat(false);
      } else {
        // Create an on-demand chat room if none exists to start conversations immediately
        const newRoomId = [currentUser.id, tgtUser.id].sort().join('_');
        const defaultRoom: ChatRoom = {
          id: newRoomId,
          project_id: 'direct_deal',
          project_title: `Comunicação Direta por Perfil`,
          client_id: currentUser.role === 'client' ? currentUser.id : tgtUser.id,
          freelancer_id: currentUser.role !== 'client' ? currentUser.id : tgtUser.id,
          client_name: currentUser.role === 'client' ? currentUser.name : tgtUser.name,
          freelancer_name: currentUser.role !== 'client' ? currentUser.name : tgtUser.name,
          last_message: 'Sala de chat estabelecida.',
          updated_at: new Date().toISOString()
        };
        
        try {
          await setDoc(doc(db, 'chats', newRoomId), defaultRoom);
          setActiveChat(defaultRoom);
        } catch (e) {
          console.warn('Silent chat setup fallback.', e);
        }
        setLoadingChat(false);
      }
    });

    return () => unsubscribe();
  }, [currentUser, tgtUser]);

  // Listen to messages specifically inside matched index chat channel
  useEffect(() => {
    if (!activeChat) return;
    
    const pathMsgs = `chats/${activeChat.id}/messages`;
    const q = query(collection(db, pathMsgs), orderBy('created_at', 'asc'));
    const unsubscribeMsgs = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
    }, (err) => {
      console.warn('Realtime chat subcollection fetch permission details restricted.', err);
    });

    return () => unsubscribeMsgs();
  }, [activeChat]);

  // Trigger Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeChat || (!msgInput && !uploadLog)) return;

    const path = `chats/${activeChat.id}/messages`;
    const payload: Partial<Message> = {
      chat_id: activeChat.id,
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      text: msgInput || `Arquivo enviado: ${uploadLog?.name}`,
      file_name: uploadLog?.name || '',
      file_url: uploadLog?.url || '',
      created_at: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, path), payload);
      
      // Update chat last message
      await setDoc(doc(db, 'chats', activeChat.id), {
        last_message: msgInput || `[Upload] ${uploadLog?.name}`,
        updated_at: new Date().toISOString()
      }, { merge: true });

      setMsgInput('');
      setUploadLog(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  // Simulating high fidelity secure PDF contract upload log inside real-time chat
  const handleSimulateFileUpload = () => {
    setUploading(true);
    setTimeout(() => {
      const simulatedUrl = `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`;
      setUploadLog({ name: 'Contrato_Escrow_Assinado.pdf', url: simulatedUrl });
      setUploading(false);
      alert('Arquivo carregado com sucesso no log de mídia do chat! Pressione enviar para anexar a transação.');
    }, 1200);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <Clock className="w-10 h-10 text-teal-400 animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Carregando portfólio profissional...</p>
      </div>
    );
  }

  if (!tgtUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-red-400 font-bold">Perfil não encontrado.</p>
        <Link to="/" className="text-teal-400 hover:underline">Voltar para o Início</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-screen">
      
      {/* Back button */}
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white hover:underline">
          <ArrowLeft className="w-4 h-4" /> Voltar para o Início / Landing
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Resume detailed CV card */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="bg-gray-950 border border-gray-900 rounded-3xl p-6 md:p-8 space-y-8 relative overflow-hidden shadow-xl">
            {/* Visual gradient backdrop */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-teal-500 via-sky-500 to-emerald-500"></div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-gray-900">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-900 border-2 border-teal-500/10 p-1">
                  <img src={tgtUser.avatar} alt={tgtUser.name} className="w-full h-full rounded-full object-cover" />
                </div>

                <div className="space-y-1 ml-1">
                  <h1 className="text-xl sm:text-2xl font-display font-black text-white">{tgtUser.name}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-gray-900 border border-gray-800 text-teal-400 px-2 py-0.5 rounded-full">
                      {tgtUser.role === 'freelancer' ? 'Developer' : tgtUser.role === 'admin' ? 'Administrador' : 'Cliente'}
                    </span>
                    {tgtUser.verified && (
                      <span className="text-[10px] font-semibold text-teal-400 bg-teal-950/20 border border-teal-900 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verificado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reputation rating display */}
              <div className="bg-gray-900 border border-gray-800/80 px-4 py-3 rounded-2xl flex flex-col items-center sm:items-end text-center sm:text-right">
                <span className="text-[10px] uppercase font-mono text-gray-500">Reputação Geral</span>
                <div className="flex items-center gap-1.5 text-base font-extrabold text-amber-400 font-mono mt-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{tgtUser.reputation} Pontos</span>
                </div>
              </div>
            </div>

            {/* Profile Bio Statement */}
            <div className="space-y-2">
              <h3 className="text-gray-400 text-xs font-mono uppercase tracking-widest">Sobre Mim / Biografia</h3>
              <p className="text-sm text-gray-300 leading-relaxed italic bg-gray-900/40 border border-gray-900 p-4 rounded-2xl">
                "{tgtUser.bio || 'Este membro do ecossistema prefere manter sua biografia em sigilo.'}"
              </p>
            </div>

            {/* Technical Detail if Practitioner/Developer */}
            {tgtUser.role !== 'client' && tgtProfile && (
              <div className="space-y-6 pt-2">
                <div className="space-y-2.5">
                  <h3 className="text-gray-400 text-xs font-mono uppercase tracking-widest">Skills & Tecnologias</h3>
                  <div className="flex flex-wrap gap-2">
                    {tgtProfile.skills.map((skill, index) => (
                      <span key={index} className="bg-teal-950/40 border border-teal-800/50 hover:bg-teal-900/30 text-teal-400 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-gray-400 text-xs font-mono uppercase tracking-widest">Nível e Experiência Comercial</h3>
                  <div className="text-sm text-gray-200 font-semibold flex items-center gap-2">
                    <UserCheck className="w-4.5 h-4.5 text-teal-400" />
                    {tgtProfile.experience || 'Profissional atuando sob demanda.'}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-gray-400 text-xs font-mono uppercase tracking-widest">Detalhamento Completo do Portfólio</h3>
                  <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line bg-gray-900/20 p-4 rounded-xl border border-gray-900">
                    {tgtProfile.portfolio}
                  </p>
                </div>

                {/* External accounts buttons */}
                {(tgtProfile.github || tgtProfile.linkedin) && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    {tgtProfile.github && (
                      <a 
                        href={tgtProfile.github} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs bg-gray-900 border border-gray-800 hover:border-gray-750 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl transition-all font-semibold"
                      >
                        <Github className="w-4 h-4 text-emerald-400" />
                        Github Dev
                      </a>
                    )}
                    {tgtProfile.linkedin && (
                      <a 
                        href={tgtProfile.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs bg-gray-900 border border-gray-800 hover:border-gray-750 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl transition-all font-semibold"
                      >
                        <Linkedin className="w-4 h-4 text-sky-400" />
                        LinkedIn Corp
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column: High-Fidelity Realtime Chat Box directly integrated */}
        <div className="col-span-1 space-y-6">
          <div className="bg-gray-950 border border-gray-900 rounded-3xl p-6 shadow-xl h-[520px] flex flex-col justify-between overflow-hidden relative">
            
            <div className="absolute top-0 inset-x-0 h-1.5 bg-teal-600"></div>

            <div className="space-y-1 pb-3 border-b border-gray-900">
              <span className="text-[9px] font-mono text-gray-500 font-extrabold uppercase tracking-widest block">Negociação Integrada Realtime</span>
              <h3 className="font-display font-extrabold text-sm text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-teal-400" />
                Negociar com {tgtUser.name.split(' ')[0]}
              </h3>
            </div>

            {/* Chat Body messages queue */}
            <div className="flex-1 overflow-y-auto px-1 py-4 space-y-3.5 custom-scrollbar h-[320px]">
              {loadingChat ? (
                <div className="text-center py-10 space-y-2">
                  <Clock className="w-6 h-6 animate-spin text-teal-400 mx-auto" />
                  <p className="text-[10px] text-gray-500 font-mono">Sincronizando canal criptografado...</p>
                </div>
              ) : currentUser?.id === tgtUser.id ? (
                <div className="text-center py-10 text-gray-500 text-xs px-2 space-y-2">
                  <Settings className="w-8 h-8 mx-auto text-gray-600 animate-spin" />
                  <p>Este é o seu próprio perfil visual. Use as abas do Painel de Trabalho para atualizar seus portfolios.</p>
                </div>
              ) : !currentUser ? (
                <div className="text-center py-10 text-gray-500 text-xs px-2 space-y-2">
                  <Lock className="w-6 h-6 mx-auto text-amber-500" />
                  <p>Inicie uma sessão para fechar contratos técnicos e trocar mensagens em real-time com {tgtUser.name}.</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-500 px-4">
                  Nenhuma mensagem trocada ainda. Envie o primeiro texto para inaugurar a negociação!
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id === currentUser.id;
                  return (
                    <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
                      <span className="text-[9px] font-mono text-gray-500">{m.sender_name}</span>
                      <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                        isMe ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none'
                      }`}>
                        <p>{m.text}</p>
                        {m.file_url && (
                          <div className="mt-2 pt-1 border-t border-white/20 flex items-center gap-1 text-[10px] font-semibold text-teal-100 hover:underline">
                            <FileText className="w-3 h-3" />
                            <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="truncate max-w-[150px]">{m.file_name}</a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat message composer */}
            {currentUser && currentUser.id !== tgtUser.id && (
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-gray-900 space-y-3">
                {/* Simulated File upload preview */}
                {uploadLog && (
                  <div className="flex items-center justify-between bg-teal-950/40 p-2 rounded-xl text-[10px] text-teal-400 border border-teal-900">
                    <span className="truncate font-mono font-semibold">{uploadLog.name}</span>
                    <button type="button" onClick={() => setUploadLog(null)} className="text-gray-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateFileUpload}
                    className="bg-gray-900 hover:bg-gray-850 p-2 text-gray-400 hover:text-teal-400 rounded-xl cursor-pointer border border-gray-800"
                    title="Anexar arquivo de portfólio ou contrato"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    required={!uploadLog}
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    placeholder="Escreva sua mensagem comercial..."
                    className="flex-1 bg-gray-900 border border-gray-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-gray-205 outline-none"
                  />

                  <button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl p-2.5 shadow-md transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
