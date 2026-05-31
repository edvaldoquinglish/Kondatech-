# 🌐 Konda Tech — Plataforma de Comunidade e Marketplace Freelancer

> **Konda Tech** é um ecossistema completo e altamente otimizado projetado para conectar de forma transparente clientes finais a desenvolvedores profissionais e freelancers de alto nível técnico. A plataforma conta com recursos para contratação segura via **sistema de Escrow**, **chat em tempo real**, **controle de reputação profissional**, **KYC/verificação de desenvolvedores** e **emissão automática de relatórios em formato PDF**.

---

## 🎨 Visão Geral do Ecossistema

Esta plataforma foi desenvolvida utilizando conceitos modernos de design voltados à usabilidade intuitiva (UX), integrando engenharia de estado baseada em **React (Vite)**, design de alta fidelidade com **Tailwind CSS** e conectividade em tempo real por meio da suíte **Firebase (Authentication, Firestore e Rules)**.

```
                  ┌──────────────────────────────┐
                  │          KONDA TECH          │
                  │   Marketplace & Comunidade   │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
┌─────────────────────────┐                     ┌─────────────────────────┐
│     📱 CLIENTE (User)   │                     │  💻 PROFISSIONAL (Dev)   │
├─────────────────────────┤                     ├─────────────────────────┤
│ • Cadastro via Celular  │                     │ • Acesso via Google Lnk │
│ • Criação de Atividades │                     │ • Perfil Detalhado/KYC  │
│ • Depósito via Escrow   │                     │ • Propostas de Projetos │
│ • Chat de Negociação    │                     │ • Avaliação de Reputação│
└─────────────────────────┘                     └─────────────────────────┘
```

---

## 🧠 Arquitetura Inteligente de Autenticação

A Konda Tech implementa regras rígidas e inteligentes para distinguir os perfis e suas permissões na plataforma:

### 1. Funções Baseadas em Provedor (Role-Mapping)
- **👥 Cliente (Client):** Identificado quando o usuário realiza o cadastro pelo fluxo tradicional de formulário com número de celular. Os clientes têm acesso à publicação de novas demandas, contratação segura e avaliação de freelancers.
- **🚀 Profissional / Freelancer:** Identificado quando o usuário realiza a autenticação rápida integrando o **Google Sign-In**. Profissionais podem preencher perfis detalhados de portfólio, submeter seu KYC de validação de documentos, enviar propostas de serviço e acumular reputação técnica.

### 2. Módulo de Análise e Homologação de Números Internacionais
Integrado diretamente no formulário de acesso por celular, a plataforma conta com um analisador dinâmico de padrões móveis, garantindo validação robusta para os seguintes países:

*   **🇧🇷 Brasil (+55):** Identifica e formata de acordo com os códigos de área (DDD) e valida números com 10 ou 11 dígitos, prevendo o nono dígito móvel.
*   **🇦🇴 Angola (+244):** Valida os blocos numéricos específicos de Angola (requerendo exatamente 9 dígitos) e emite alertas contextuais caso o número não seja iniciado com o dígito móvel regulamentado `9`.
*   **🇺🇸 Estados Unidos (+1):** Reconhece a estrutura numérica norte-americana exigindo os 10 dígitos padrões que incluem código de área.

---

## ⚡ Recursos e Módulos do Sistema

### 🛡️ Fluxo de Transações Seguras (Escrow)
Garante a integridade financeira para ambas as partes. O pagamento pelo projeto fica custodiado/retido de forma segura na plataforma e só é liberado ao profissional após a entrega e validação de qualidade por parte do cliente contratante.

### 💬 Chat Multilateral em Tempo Real
Canal de mensageria dinâmico e direto integrado ao Firestore. Permite trocas de mensagens instantâneas entre o cliente e o desenvolvedor para alinhar prazos, compartilhar atualizações técnicas e negociar propostas.

### 📝 KYC e Painel de Controle Administrativo (Admin Panel)
O ecossistema possui um módulo restrito para administradores que monitora a saúde das transações, gerencia disputas abertas e revisa documentações pendentes fornecidas pelos desenvolvedores profissionais (KYC), garantindo que apenas profissionais sérios e auditados atuem no marketplace.

### 📊 Relatórios Dinâmicos & Reputação
Um painel gerencial que calcula o índice de confiabilidade e desempenho técnico de cada freelancer. Os relatórios analíticos de progresso e atividade podem ser gerados e exportados sob demanda no formato PDF diretamente pela interface.

---

## 🛠️ Tecnologias e Dependências

As principais tecnologias presentes na solução compreendem:

-   **Frontend:** React (Vite) + TypeScript (Tipo Estrito)
-   **Estilização:** Tailwind CSS (Arquitetura Utilitária Integrada `@import "tailwindcss";`)
-   **Ícones e Elementos Visuais:** Lucide React
-   **Animações:** Motion (`motion/react`)
-   **Banco de Dados & Autenticação:** Firebase Cloud Firestore & Firebase Auth

---

## 🚀 Como Iniciar o Projeto Localmente

### 1. Clonar e Instalar as Dependências
Instale todos os pacotes e módulos do projeto:
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto contendo as credenciais de sua aplicação (conforme esquema definido no `.env.example`):
```env
# Exemplo de configuração de ambiente
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
```

### 3. Executar em Modo de Desenvolvimento
Inicie o servidor de testes:
```bash
npm run dev
```
O servidor será disponibilizado por padrão na porta `3000`.

---

## 📈 Regras de Segurança e Banco de Dados (`firestore.rules`)
As permissões de leitura e gravação no banco de dados residem inteiramente em regras declarativas robustas. Isso impede que um perfil do tipo `client` altere dados pertencentes a transações de `freelancer` ou modifique revisões do `AdminPanel`, mantendo o sistema livre de fraudes e acessos indesejados.
