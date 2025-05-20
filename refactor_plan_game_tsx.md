## Plano de Desenvolvimento - Refatoração e Tipagem do Game.tsx

**Objetivo:** Corrigir todos os erros de tipagem TypeScript no arquivo `Game.tsx`, garantir que o código seja robusto, bem tipado e siga as melhores práticas, eliminando warnings e elementos não utilizados, para permitir um build limpo e a geração do zip final do projeto.

**Etapas Detalhadas para Refatoração e Tipagem de `Game.tsx`:**

1.  **Definir Tipos para o Estado do Jogo (`GameState`):
    *   Analisar `INITIAL_STATE` em `gameLogic.js`.
    *   Criar uma interface ou tipo `GameState` que reflita a estrutura completa do estado, incluindo todos os seus campos e seus respectivos tipos (ex: `deck: Card[]`, `boardCards: Card[]`, `player1Score: number`, `gameMode: 'classic' | 'solo_time_attack' | 'daily_challenge'`, etc.).
    *   Considerar a criação de tipos/interfaces para estruturas aninhadas, como `Card`.

2.  **Definir Tipos para as Ações do Reducer (`GameAction`):
    *   Analisar `ACTIONS` e a estrutura dos `payloads` esperados por cada ação no `gameReducer` em `gameLogic.js`.
    *   Criar tipos individuais para cada ação (ex: `{ type: ACTIONS.SELECT_CARD; payload: { cardId: string } }`, `{ type: ACTIONS.SET_GAME_MODE; payload: { mode: string } }`).
    *   Criar um tipo união `GameAction` que englobe todos os tipos de ação possíveis.

3.  **Tipar o `gameReducer` em `gameLogic.js` (ou criar um `gameLogic.ts`):
    *   Idealmente, converter `gameLogic.js` para `gameLogic.ts` para ter tipagem forte no reducer.
    *   Se não for possível converter o arquivo inteiro, pelo menos garantir que a função `gameReducer` exportada seja adequadamente tipada em termos de `state: GameState` e `action: GameAction`.

4.  **Aplicar Tipos no Componente `Game.tsx`:**
    *   **`useReducer`:** Tipar o hook `useReducer` com `GameState` e `GameAction`: `const [state, dispatch] = useReducer<GameState, GameAction>(gameReducer, initialGameConfig());`
    *   **`initialGameConfig`:** Garantir que a função `initialGameConfig` retorne um objeto que satisfaça a interface `GameState`.
    *   **`useState` Hooks:** Adicionar tipos explícitos para os estados gerenciados por `useState` (ex: `useState<boolean>(true)`, `useState<string[]>([]), useState<number | null>(null)` para `classicTimerRef` e `soloTimerRef` se eles forem guardar IDs de timers).
    *   **`useRef` Hooks:** Tipar os `useRef` hooks. Por exemplo, `useRef<NodeJS.Timeout | null>(null)` para timers.
    *   **Parâmetros de Funções:** Adicionar tipos explícitos para todos os parâmetros de funções e manipuladores de eventos (ex: `handleCardClick = (cardId: string) => {...}`, `handleGameModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {...}`).
    *   **Valores de Retorno de Funções:** Adicionar tipos explícitos para os valores de retorno das funções, se aplicável.
    *   **Chamadas `dispatch`:** Garantir que todas as chamadas `dispatch` enviem ações que correspondam a um dos tipos definidos em `GameAction` e que os `payloads` estejam corretos.
    *   **Variáveis Locais:** Adicionar tipos a variáveis locais onde a inferência não for clara ou para melhorar a legibilidade.

5.  **Corrigir Erros de Tipagem Específicos:**
    *   **TS7006 (Implicit any):** Adicionar tipos explícitos a todos os parâmetros e variáveis onde este erro ocorre.
    *   **TS2554 (Expected 0 arguments, but got 1):** Verificar a assinatura das funções `dispatch` ou outras funções sendo chamadas. Este erro geralmente ocorre quando o `dispatch` espera uma ação sem payload, mas uma com payload é enviada, ou vice-versa, ou se a própria função `dispatch` do `useReducer` não está corretamente tipada.
    *   Outros erros de TypeScript que surgirem.

6.  **Refatorar e Limpar o Código:**
    *   Remover quaisquer variáveis, funções ou importações não utilizadas (conforme apontado pelo ESLint ou TypeScript).
    *   Melhorar a legibilidade e a estrutura do código, se necessário.
    *   Garantir que o ESLint (`npm run lint`) não reporte mais erros (warnings são aceitáveis se justificados, mas erros devem ser corrigidos).

7.  **Testar o Build:** Executar `npm run build` para garantir que o projeto compila sem erros TypeScript.

**Próximo Passo Imediato:** Começar pela criação das definições de tipo para `GameState` e `GameAction` em um novo arquivo (ex: `src/types/gameTypes.ts`) ou diretamente no `Game.tsx` se forem escopo local, e então importar e aplicar esses tipos no `Game.tsx`.
