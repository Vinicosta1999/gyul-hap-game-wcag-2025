# Gyul! Hap! - Versão Integral de Melhorias (Maio 2025)

Este projeto é uma versão significativamente aprimorada do jogo Gyul! Hap!, incorporando uma vasta gama de melhorias solicitadas pelo usuário, com foco em novas funcionalidades, maior configurabilidade, experiência de usuário enriquecida, e otimizações gerais. O objetivo foi integrar todas as sugestões dos arquivos `pasted_content.txt` e `pasted_content_2.txt` fornecidos, dentro do escopo de um projeto frontend.

## Tecnologias Utilizadas

*   React (com Vite)
*   JavaScript (ES6+)
*   TypeScript (para tipagem e melhor integração com o ecossistema Vite/React)
*   Tailwind CSS
*   i18next (para internacionalização)
*   Howler.js (para áudio, através do hook `useSound`)
*   Vitest (para testes unitários)
*   ESLint (para linting de código)
*   Next-Themes (para gerenciamento de tema claro/escuro)

## Estrutura do Projeto

```
/gyul_hap_final_project
  ├── README.md                 # Este arquivo
  ├── RELATORIO_FINAL_INTEGRAL_GYUL_HAP.md # Relatório detalhado desta fase de melhorias
  ├── todo_consolidado_verificacao.md # Checklist das melhorias implementadas e verificadas
  ├── package.json
  ├── vite.config.js
  ├── tailwind.config.js
  ├── postcss.config.js
  ├── public/
  │   ├── sounds/               # Arquivos de áudio (FX e música)
  │   └── ... (outros assets públicos, como ícones se houver)
  └── src/
      ├── components/           # Componentes React (Card, Board, Game, PlayerPanel, Modais, etc.)
      ├── lib/                  # Lógica do jogo (gameLogic.js, cardUtils.js, useSound.js)
      │   └── tests/            # Testes unitários para a lógica do jogo (gameLogic.test.js, cardUtils.test.js)
      ├── hooks/                # Hooks customizados (ex: use-toast.ts, useSound.js)
      ├── styles/               # Arquivos CSS/SCSS específicos de componentes, se necessário (index.css é global)
      ├── assets/               # Imagens, fontes, etc., que são importadas diretamente no JS/TS
      ├── App.tsx               # Componente raiz da aplicação
      ├── main.tsx              # Ponto de entrada da aplicação React (configura Root, Providers)
      ├── i18n.js               # Configuração do i18next (traduções embutidas ou carregadas)
      ├── index.css             # Estilos globais e customizações Tailwind
      └── ... (outros arquivos, como types.ts)
```

## Para Iniciar (Desenvolvimento)

1.  **Pré-requisitos:**
    *   Node.js (versão 18 ou superior recomendada)
    *   npm (gerenciador de pacotes)

2.  **Instalação de Dependências:**
    Navegue até o diretório raiz do projeto (`/home/ubuntu/gyul_hap_final_project/`) e execute:
    ```bash
    npm install --legacy-peer-deps
    ```
    *Nota: `--legacy-peer-deps` pode ser necessário devido a algumas dependências do ecossistema React e TailwindCSS que podem ter conflitos de peer dependency não críticos.*

3.  **Executar o Servidor de Desenvolvimento:**
    ```bash
    npm run dev
    ```
    Isso iniciará o servidor de desenvolvimento Vite, geralmente em `http://localhost:5173`.

4.  **Executar Testes Unitários:**
    ```bash
    npm test
    ```

5.  **Verificar Linting:**
    ```bash
    npm run lint
    ```

6.  **Build para Produção:**
    Para gerar uma versão otimizada para produção (arquivos estáticos na pasta `dist/`):
    ```bash
    npm run build
    ```

## Principais Melhorias Implementadas Nesta Versão Integral

Consulte o arquivo `RELATORIO_FINAL_INTEGRAL_GYUL_HAP.md` para uma descrição exaustiva de todas as funcionalidades e aprimoramentos.

**Destaques:**

*   **Modos de Jogo:**
    *   **Clássico (2 Jogadores):** Modo competitivo tradicional.
    *   **Solo Contra o Tempo:** Desafio individual para encontrar o máximo de Haps em um tempo configurável.
    *   **Desafio Diário:** Modo solo com um tabuleiro único gerado por um seed diário, com controle de conclusão diária.
*   **Configuração do Jogo Expandida:**
    *   Seleção de Modo de Jogo.
    *   Timer por Jogada (Modo Clássico): Configurável (incluindo OFF) e persistente.
    *   Número de Rodadas (Modo Clássico): Configurável (incluindo Ilimitado) e persistente.
    *   Tempo Total (Modo Solo/Diário): Configurável (fixo para Diário) e persistente.
    *   **Seleção de Conjunto de Cartas:** Permite ao usuário escolher entre diferentes conjuntos de atributos visuais para as cartas (cores, formas, fundos), com persistência da escolha (exceto para Desafio Diário que usa um conjunto fixo).
*   **Internacionalização (i18n):**
    *   Suporte completo para Português (pt) e Inglês (en) em toda a interface.
    *   Seletor de idioma persistente.
*   **Áudio Aprimorado:**
    *   Música de fundo com controle de Ligar/Desligar (persistente).
    *   Efeitos sonoros expandidos para diversas ações do jogo.
    *   Controle de Mudo para efeitos sonoros (persistente).
*   **Temas Visuais:**
    *   Suporte para tema Claro (Light) e Escuro (Dark).
    *   Toggle para alternar entre temas, com persistência da escolha do usuário.
*   **Tutorial Interativo:**
    *   Modal "Como Jogar" detalhado e acessível, explicando regras, atributos das cartas, conceito de Hap, Gyul e pontuação para todos os modos de jogo.
*   **Leaderboard Local:**
    *   Placar para os modos Solo Contra o Tempo e Desafio Diário, salvando as 10 melhores pontuações com nome do jogador no `localStorage`.
    *   Opção para limpar o placar.
*   **Interface e Experiência do Usuário (UI/UX):**
    *   Refinamentos visuais para maior clareza e consistência.
    *   Melhorias na responsividade para dispositivos móveis.
    *   Animações sutis para feedback de interações.
    *   Mensagens de status mais claras e dinâmicas.
*   **Acessibilidade (A11y):**
    *   Melhorias na semântica HTML (uso de `section`, `article`, `nav`, etc.).
    *   Uso de atributos ARIA (como `aria-label`, `aria-labelledby`, `aria-pressed`, `role`) para melhorar a experiência com leitores de tela.
    *   Navegação por teclado aprimorada para elementos interativos (botões, cartas, modais).
    *   Foco gerenciado em modais.
    *   Contraste de cores revisado (embora uma auditoria WCAG completa não tenha sido realizada).
*   **Otimizações de Performance:**
    *   Revisão de componentes para reduzir renderizações desnecessárias (`React.memo`, `useCallback`).
*   **Testes Automatizados:**
    *   Expansão dos testes unitários para a lógica do jogo (`gameLogic.js`, `cardUtils.js`) usando Vitest.
    *   Script `npm test` configurado e funcional.

## Limitações Conhecidas e Sugestões Futuras

Detalhes no `RELATORIO_FINAL_INTEGRAL_GYUL_HAP.md`.

**Principais Limitações:**
*   **Sem Backend:** Funcionalidades como placares online persistentes, multiplayer em tempo real, ou desafios diários com seed unificado globalmente não foram implementadas, pois exigiriam um backend.
*   **IA Adversária:** Não há oponente controlado por IA no modo clássico.
*   **Acessibilidade WCAG Completa:** Embora melhorias tenham sido feitas, uma auditoria formal WCAG e a implementação de todas as suas diretrizes não foram realizadas.

**Sugestões Futuras:**
*   Implementação de um backend para as funcionalidades mencionadas acima.
*   Criação de um construtor de conjuntos de cartas pela interface.
*   Modos de jogo adicionais (ex: cooperativo).
*   Auditoria e conformidade completa com WCAG.

