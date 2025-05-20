# Análise de Requisitos Avançados - Gyul Hap Full Stack

Este documento detalha os requisitos para as novas funcionalidades do jogo Gyul Hap, incluindo backend, inteligência artificial (IA) e acessibilidade (WCAG).

## 1. Funcionalidades de Backend

O backend será responsável por gerenciar dados persistentes e interações em tempo real que vão além do armazenamento local do navegador.

### 1.1. Placares Online Persistentes

*   **Requisito:** Implementar um sistema de placares online para os modos de jogo Solo Contra o Tempo e Desafio Diário.
*   **Critérios de Aceitação:**
    *   Usuários devem poder submeter suas pontuações ao final de uma partida nos modos aplicáveis.
    *   O sistema deve armazenar as pontuações associadas a um identificador de usuário (apelido/nome).
    *   Deve ser possível visualizar um ranking global (e.g., Top 10, Top 50) para cada modo de jogo.
    *   As pontuações devem ser persistentes entre sessões e dispositivos (se houver autenticação).
    *   Considerar medidas anti-cheat básicas (e.g., validação de pontuação no servidor).
*   **Fluxo de Dados:** Frontend envia dados da partida (pontuação, modo, tempo, etc.) para API do backend -> Backend valida e armazena -> Frontend solicita e exibe placares.
*   **Tecnologias Sugeridas:** Node.js com Express.js, banco de dados NoSQL (MongoDB) ou SQL (PostgreSQL/MySQL).

### 1.2. Multiplayer em Tempo Real (Modo Clássico)

*   **Requisito:** Permitir que dois jogadores joguem o modo Clássico em tempo real pela internet.
*   **Critérios de Aceitação:**
    *   Jogadores devem poder criar ou entrar em salas de jogo.
    *   O estado do jogo (cartas na mesa, pontuações, vez do jogador) deve ser sincronizado entre os jogadores em tempo real.
    *   Ações de um jogador (selecionar cartas, declarar Gyul/Hap) devem ser refletidas para o outro jogador.
    *   O sistema deve lidar com conexões e desconexões de jogadores.
    *   Deve haver um mecanismo para determinar o vencedor da partida/rodada.
*   **Fluxo de Dados:** Interações do jogador no frontend -> Eventos enviados via WebSockets para o backend -> Backend processa a lógica do jogo e atualiza o estado da sala -> Backend transmite o novo estado para todos os jogadores na sala via WebSockets -> Frontend atualiza a interface.
*   **Tecnologias Sugeridas:** WebSockets (e.g., Socket.IO) sobre Node.js.

### 1.3. Desafios Diários com Seed Unificado Globalmente

*   **Requisito:** Implementar um modo de Desafio Diário onde todos os jogadores recebem o mesmo conjunto de cartas (mesma seed) a cada dia.
*   **Critérios de Aceitação:**
    *   O backend deve gerar ou definir uma seed única para o desafio de cada dia.
    *   Todos os jogadores que acessarem o Desafio Diário em um determinado dia devem jogar com a mesma sequência de cartas gerada por essa seed.
    *   As pontuações do Desafio Diário devem ser submetidas ao placar online específico deste modo.
    *   O sistema deve impedir que um jogador jogue o mesmo desafio diário múltiplas vezes para melhorar a pontuação (permitir apenas uma submissão válida por dia).
*   **Fluxo de Dados:** Frontend solicita desafio diário -> Backend fornece a seed do dia (ou o conjunto de cartas) -> Frontend executa o jogo com a seed -> Frontend submete pontuação -> Backend valida e armazena.
*   **Tecnologias Sugeridas:** Lógica no backend para gerenciamento de seeds diárias e controle de submissão.

## 2. Oponente de Inteligência Artificial (IA)

*   **Requisito:** Desenvolver um oponente controlado por IA para o modo Clássico, permitindo que um jogador jogue contra o computador.
*   **Critérios de Aceitação:**
    *   A IA deve ser capaz de identificar combinações válidas de Gyul/Hap no tabuleiro.
    *   A IA deve simular um jogador, tomando decisões em sua vez.
    *   O nível de dificuldade da IA pode ser considerado (e.g., tempo de reação, precisão), mas uma primeira versão pode focar na funcionalidade básica.
    *   A IA deve interagir com a lógica do jogo de forma similar a um jogador humano (respeitando regras, timer por jogada, etc.).
*   **Estratégia de Implementação:**
    *   A lógica da IA residirá no frontend ou backend? (Considerar complexidade e necessidade de estado compartilhado. Para um oponente no modo clássico local, pode ser no frontend. Se a IA precisar interagir com um jogo multiplayer hospedado no backend, a lógica pode precisar estar no servidor ou ser comunicada a ele).
    *   Algoritmo: A IA precisará escanear o tabuleiro e aplicar a lógica de `isHap` para encontrar conjuntos. Pode ter diferentes estratégias (e.g., encontrar o primeiro Hap possível, tentar encontrar o mais rápido, etc.).

## 3. Acessibilidade WCAG Completa

*   **Requisito:** Realizar uma auditoria completa de acessibilidade no frontend do jogo e implementar todas as correções necessárias para atingir conformidade com as Web Content Accessibility Guidelines (WCAG) 2.1 ou 2.2, nível AA como meta mínima.
*   **Critérios de Aceitação:**
    *   **Perceptível:**
        *   Todas as imagens não textuais devem ter alternativas textuais apropriadas (e.g., `alt` text para cartas, ícones).
        *   Conteúdo não deve depender exclusivamente de cor para transmitir informação (e.g., status de seleção de cartas).
        *   Contraste de cores suficiente entre texto e fundo, e entre componentes gráficos e fundo.
        *   Texto deve ser redimensionável até 200% sem perda de conteúdo ou funcionalidade.
        *   Uso adequado de legendas e transcrições para conteúdo multimídia (se aplicável, e.g., vídeo tutorial).
    *   **Operável:**
        *   Toda funcionalidade deve ser operável via teclado, sem requerer mouse.
        *   Foco do teclado deve ser visível e seguir uma ordem lógica.
        *   Não deve haver armadilhas de teclado (keyboard traps).
        *   Tempo ajustável: Se houver limites de tempo (timer por jogada), deve haver maneiras de ajustar, estender ou remover o limite (já parcialmente implementado, verificar abrangência).
        *   Evitar conteúdo que pisca mais de três vezes por segundo.
        *   Mecanismos de navegação claros (cabeçalhos, landmarks ARIA, links descritivos).
    *   **Compreensível:**
        *   Idioma da página e de partes do conteúdo deve ser definido programaticamente.
        *   Navegação consistente em todo o site/aplicação.
        *   Componentes interativos devem ter comportamento previsível.
        *   Mecanismos de ajuda e feedback para erros de entrada devem ser claros e acessíveis.
    *   **Robusto:**
        *   Código HTML/CSS/JS deve ser válido e bem formado para garantir compatibilidade com tecnologias assistivas.
        *   Uso correto de ARIA (Accessible Rich Internet Applications) para componentes dinâmicos e personalizados (modais, abas, etc.), garantindo que nomes, papéis e estados sejam expostos corretamente.
        *   Testes com leitores de tela (NVDA, VoiceOver, JAWS) e outras tecnologias assistivas.
*   **Processo de Auditoria e Implementação:**
    1.  Utilizar ferramentas de avaliação automática (e.g., Axe, WAVE, Lighthouse).
    2.  Realizar testes manuais abrangentes (navegação por teclado, leitores de tela, zoom, contraste).
    3.  Documentar todas as não conformidades encontradas.
    4.  Priorizar e implementar correções.
    5.  Re-testar para verificar a conformidade.

## 4. Considerações Gerais

*   **Manutenibilidade e Escalabilidade:** O código do backend e frontend deve ser bem estruturado, comentado e testável.
*   **Segurança:** Considerar segurança básica para APIs do backend (validação de entrada, prevenção de ataques comuns como XSS, SQL Injection se aplicável).
*   **Experiência do Usuário (UX):** As novas funcionalidades devem ser integradas de forma intuitiva e não devem degradar a experiência do usuário existente.
*   **Testes:** Unidade, integração e testes end-to-end (quando possível) para todas as novas funcionalidades.

