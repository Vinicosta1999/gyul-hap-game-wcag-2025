# Arquitetura do Backend e Integração - Gyul Hap Full Stack

Este documento descreve a arquitetura planejada para o backend do jogo Gyul Hap, bem como a estratégia de integração com o frontend e a lógica da IA.

## 1. Visão Geral da Arquitetura

O backend será construído como uma aplicação Node.js utilizando o framework Express.js para as APIs REST e Socket.IO para comunicação em tempo real (multiplayer). A persistência de dados será gerenciada por um banco de dados relacional (PostgreSQL) ou NoSQL (MongoDB), a ser definido com base na complexidade final dos relacionamentos de dados, mas com preferência inicial por PostgreSQL devido à estruturação de placares e usuários.

O frontend (React) interagirá com o backend através de:
*   **APIs RESTful:** Para autenticação, gerenciamento de placares (exceto em tempo real durante o jogo), e obtenção de dados de desafios diários.
*   **WebSockets (Socket.IO):** Para a funcionalidade de multiplayer em tempo real, sincronizando o estado do jogo entre os participantes de uma sala.

A lógica da IA para o oponente no modo clássico será implementada primariamente no frontend para simplificar a arquitetura e reduzir a carga no servidor para jogos single-player. No entanto, o backend poderá ser usado para validar pontuações ou jogadas da IA se necessário no futuro para evitar trapaças em contextos competitivos que possam surgir.

## 2. Componentes do Backend

### 2.1. Servidor de Aplicação
*   **Tecnologia:** Node.js
*   **Framework:** Express.js
*   **Responsabilidades:**
    *   Servir as APIs REST.
    *   Gerenciar conexões WebSocket.
    *   Orquestrar a lógica de negócios para placares, desafios diários e multiplayer.
    *   Autenticação e autorização de usuários.

### 2.2. Banco de Dados
*   **Tecnologia (Proposta Inicial):** PostgreSQL (alternativa: MongoDB)
*   **Modelos de Dados Principais (Esquema Preliminar):**
    *   **Users:**
        *   `id` (PK, serial)
        *   `username` (varchar, unique, not null)
        *   `password_hash` (varchar, not null)
        *   `email` (varchar, unique, opcional)
        *   `created_at` (timestamp, default now)
        *   `updated_at` (timestamp, default now)
    *   **Scores:**
        *   `id` (PK, serial)
        *   `user_id` (FK para Users.id, not null)
        *   `game_mode` (varchar, not null - e.g., "solo_time_attack", "daily_challenge")
        *   `score` (integer, not null)
        *   `game_duration_seconds` (integer, opcional)
        *   `played_at` (timestamp, default now)
        *   `details` (jsonb, opcional - e.g., seed do desafio, cartas encontradas)
    *   **DailyChallenges:**
        *   `id` (PK, serial)
        *   `challenge_date` (date, unique, not null)
        *   `seed` (varchar, not null)
        *   `created_at` (timestamp, default now)
    *   **DailyChallengeSubmissions:**
        *   `id` (PK, serial)
        *   `daily_challenge_id` (FK para DailyChallenges.id, not null)
        *   `user_id` (FK para Users.id, not null)
        *   `score_id` (FK para Scores.id, not null)
        *   `submitted_at` (timestamp, default now)
        *   UNIQUE (`daily_challenge_id`, `user_id`) para garantir uma submissão por dia.
    *   **GameRooms (para Multiplayer):**
        *   `id` (PK, uuid ou serial)
        *   `room_code` (varchar, unique, not null - para os jogadores entrarem)
        *   `player1_id` (FK para Users.id, opcional)
        *   `player2_id` (FK para Users.id, opcional)
        *   `current_game_state` (jsonb - armazena o estado do tabuleiro, pontuações, vez do jogador, etc.)
        *   `status` (varchar - e.g., "waiting", "in_progress", "finished")
        *   `created_at` (timestamp, default now)
        *   `updated_at` (timestamp, default now)

### 2.3. Comunicação em Tempo Real
*   **Tecnologia:** Socket.IO
*   **Responsabilidades:**
    *   Gerenciar salas de jogo para o modo multiplayer.
    *   Sincronizar o estado do jogo entre os jogadores conectados à mesma sala.
    *   Transmitir ações dos jogadores (seleção de cartas, declaração de Hap/Gyul) para os oponentes.
    *   Lidar com eventos de conexão, desconexão e reconexão de jogadores.

## 3. Design das APIs

### 3.1. APIs RESTful

*   **Autenticação (`/auth`):**
    *   `POST /auth/register`: Registrar novo usuário (username, password, email opcional).
    *   `POST /auth/login`: Autenticar usuário e retornar token (JWT).
    *   `POST /auth/logout`: Invalidar token (se aplicável, ou apenas instrução para o cliente limpar o token).
    *   `GET /auth/me`: Obter informações do usuário autenticado (requer token).
*   **Placares (`/scores`):**
    *   `POST /scores`: Submeter nova pontuação (requer token; game_mode, score, details).
    *   `GET /scores/leaderboard?game_mode=<mode>&limit=<N>`: Obter ranking para um modo de jogo específico.
*   **Desafios Diários (`/daily-challenge`):**
    *   `GET /daily-challenge/today`: Obter a seed ou os dados do desafio do dia atual.
    *   `POST /daily-challenge/submit`: Submeter pontuação para o desafio diário (requer token; score, details). O backend validará se é a primeira submissão do dia para o usuário.

### 3.2. Eventos WebSocket (Socket.IO)

*   **Namespace:** `/multiplayer` (ou similar)
*   **Eventos do Cliente para Servidor:**
    *   `create_room`: Jogador solicita a criação de uma nova sala.
    *   `join_room (room_code)`: Jogador solicita para entrar em uma sala existente.
    *   `player_action (action_type, details)`: Jogador realiza uma ação no jogo (e.g., `select_card`, `declare_hap`).
    *   `leave_room`: Jogador informa que está saindo da sala.
*   **Eventos do Servidor para Cliente(s):**
    *   `room_created (room_code, player_id)`: Confirmação de criação de sala.
    *   `room_joined (room_code, player_id, game_state)`: Confirmação de entrada na sala, com estado atual do jogo.
    *   `player_joined (player_id)`: Notifica outros jogadores na sala sobre novo participante.
    *   `game_state_update (new_state)`: Envia o estado atualizado do jogo para todos na sala.
    *   `player_action_broadcast (player_id, action_type, details)`: Transmite a ação de um jogador para o(s) outro(s).
    *   `player_left (player_id)`: Notifica que um jogador saiu.
    *   `error (message)`: Envia mensagens de erro (e.g., sala cheia, código inválido).
    *   `game_over (winner_id, scores)`: Indica o fim do jogo.

## 4. Estratégias de Autenticação e Segurança

*   **Autenticação:** JSON Web Tokens (JWT) serão usados para proteger as APIs REST. Após o login, o cliente recebe um JWT que deve ser incluído no header `Authorization` (Bearer token) das requisições subsequentes.
*   **Segurança das APIs:**
    *   Validação de entrada em todas as rotas para prevenir injeção e dados malformados (usar bibliotecas como `express-validator`).
    *   HTTPS será obrigatório em produção.
    *   Proteção contra CSRF (Cross-Site Request Forgery) se cookies forem usados para autenticação (JWT em headers é menos suscetível).
    *   Proteção contra XSS (Cross-Site Scripting) no frontend ao renderizar dados do backend.
    *   Rate limiting para prevenir abuso de APIs.
    *   Senhas devem ser armazenadas com hash seguro (e.g., bcrypt).
*   **Segurança WebSockets:**
    *   Autenticação de conexões WebSocket (e.g., passar o JWT durante o handshake inicial da conexão Socket.IO).
    *   Validação de todos os eventos e dados recebidos via WebSockets.

## 5. Integração Frontend-Backend

*   O frontend (React) usará bibliotecas como `axios` ou `fetch` para chamadas REST e `socket.io-client` para comunicação WebSocket.
*   O estado global no frontend (e.g., Zustand, Redux Toolkit) gerenciará dados do usuário, estado do jogo multiplayer, etc.
*   Serão criados hooks customizados no frontend para encapsular a lógica de comunicação com o backend (e.g., `useAuth`, `useScores`, `useMultiplayer`).

## 6. Escalabilidade e Manutenção

*   **Escalabilidade:**
    *   A arquitetura Node.js é inerentemente não bloqueante e escalável para I/O.
    *   O banco de dados pode ser otimizado e escalado separadamente.
    *   Para alta carga, considerar o uso de um cluster Node.js (e.g., PM2) e, potencialmente, serviços de balanceamento de carga.
    *   Para WebSockets, `socket.io-redis-adapter` pode ser usado para escalar horizontalmente entre múltiplos processos/servidores.
*   **Manutenção:**
    *   Código bem estruturado em módulos (e.g., rotas, controllers, services, models).
    *   Uso de variáveis de ambiente para configurações (banco de dados, segredos JWT).
    *   Logging adequado (e.g., Winston, Morgan).
    *   Testes unitários e de integração para o backend.

## 7. Próximos Passos (Implementação)

1.  Configurar o ambiente de desenvolvimento do backend (Node.js, Express, PostgreSQL/MongoDB, Socket.IO).
2.  Implementar a modelagem do banco de dados e migrações (se SQL).
3.  Desenvolver as rotas de autenticação.
4.  Implementar as APIs para placares e desafios diários.
5.  Desenvolver a lógica do servidor para multiplayer com WebSockets.

Este plano de arquitetura servirá como guia para o desenvolvimento do backend. Ele poderá ser refinado à medida que a implementação avança e novos desafios ou requisitos surgem.
