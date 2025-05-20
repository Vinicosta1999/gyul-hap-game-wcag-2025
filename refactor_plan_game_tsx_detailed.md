## Plano de Desenvolvimento - Refatoração e Tipagem do Game.tsx (Continuação)

**Objetivo:** Corrigir todos os erros de tipagem TypeScript no arquivo `Game.tsx`, garantir que o código seja robusto, bem tipado e siga as melhores práticas, eliminando warnings e elementos não utilizados, para permitir um build limpo e a geração do zip final do projeto.

**Etapas Detalhadas para Refatoração e Tipagem de `Game.tsx` (Foco nos erros atuais TS7006 e TS2554):**

1.  **Criar Arquivo de Tipos (`src/types/gameTypes.ts`):
    *   Definir uma interface base para um `Card` (ex: `id: string; shape: string; color: string; background: string; number: number;`).
    *   Definir a interface `GameState` baseada no `INITIAL_STATE` de `gameLogic.js`. Campos como `deck: Card[]`, `boardCards: Card[]`, `selectedCards: string[]` (ou `Card[]` se for mais apropriado), `player1Score: number`, `gameMode: "classic" | "solo_time_attack" | "daily_challenge"`, etc.
    *   Definir tipos para cada ação do `ACTIONS` em `gameLogic.js`, especificando o `type` e o `payload` esperado. Exemplo:
        *   `interface SetGameModeAction { type: typeof ACTIONS.SET_GAME_MODE; payload: { mode: GameState['gameMode'] } }`
        *   `interface SelectCardAction { type: typeof ACTIONS.SELECT_CARD; payload: { cardId: string } }`
        *   `interface SetMessageAction { type: typeof ACTIONS.SET_MESSAGE; payload: { message: string } }`
        *   Ações sem payload: `interface StartGameAction { type: typeof ACTIONS.START_GAME }`
    *   Criar um tipo união `GameAction` que englobe todos os tipos de ação definidos.

2.  **Modificar `gameLogic.js` (Idealmente para `gameLogic.ts`):
    *   Se possível, renomear para `gameLogic.ts` e adicionar tipagem `state: GameState` e `action: GameAction` à função `gameReducer`.
    *   Tipar `INITIAL_STATE` com `GameState`.
    *   Atualizar as importações em `Game.tsx` se o nome do arquivo mudar.

3.  **Aplicar Tipos em `Game.tsx`:**
    *   Importar `GameState` e `GameAction` (e tipos de ação específicos) de `src/types/gameTypes.ts` (ou de `gameLogic.ts` se os tipos forem definidos lá).
    *   Tipar o hook `useReducer`: `const [state, dispatch] = useReducer<GameState, GameAction>(gameReducer, initialGameConfig());`
    *   Garantir que `initialGameConfig` retorne um objeto compatível com `GameState`.
    *   **Corrigir TS7006 (Implicit any):**
        *   `handleCardClick = (cardId: string) => {...}`
        *   `handleGameModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {...}`
        *   `handleTimerDurationClassicChange = (event: React.ChangeEvent<HTMLInputElement>) => {...}` (ou `HTMLSelectElement` dependendo do input)
        *   `handleMaxRoundsChange = (event: React.ChangeEvent<HTMLInputElement>) => {...}`
        *   `handleSoloTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {...}`
        *   `handleCardSetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {...}`
        *   `handleLanguageChange = (lang: string) => {...}`
        *   `handleSubmitNameToLeaderboard = (e: React.FormEvent<HTMLFormElement>) => {...}`
        *   `saveLeaderboardScores = (scores: LeaderboardEntry[]) => {...}` (definir `LeaderboardEntry`)
        *   `addScoreToLeaderboard = (name: string, score: number, mode: string) => {...}`
    *   **Corrigir TS2554 (Dispatch incompatível):**
        *   Verificar cada chamada `dispatch({ type: ACTIONS.ACTION_NAME, payload: {...} })`.
        *   Garantir que o `payload` corresponda exatamente ao definido no tipo da ação específica em `GameAction`.
        *   Para ações sem payload (ex: `ACTIONS.START_GAME`), o dispatch deve ser `dispatch({ type: ACTIONS.START_GAME })`.
    *   Tipar `useRef` para timers: `useRef<NodeJS.Timeout | null>(null)`.
    *   Tipar `useState` para `leaderboardScores`: `useState<LeaderboardEntry[]>([])`.

4.  **Refatorar e Limpar:**
    *   Remover `useState` para `selectedGameMode`, `selectedTimerDurationClassic`, etc., se esses valores forem apenas para configurar o jogo no início e não mudarem dinamicamente *durante* o jogo de uma forma que precise de estado local no `Game.tsx` (eles parecem ser usados para configurar o `dispatch({ type: ACTIONS.SET_GAME_CONFIG })`). Se forem apenas inputs de um formulário de configuração, seu estado local é apropriado.
    *   Revisar todas as variáveis e importações para remover as não utilizadas.

5.  **Validação Iterativa:**
    *   Após cada conjunto de modificações, rodar `npm run lint` e `npm run build` para verificar os erros restantes e corrigi-los progressivamente.

**Próximo Passo Imediato:** Criar o arquivo `src/types/gameTypes.ts` e definir as interfaces `Card`, `LeaderboardEntry`, `GameState`, e os tipos para cada `GameAction` e o tipo união `GameAction`.
