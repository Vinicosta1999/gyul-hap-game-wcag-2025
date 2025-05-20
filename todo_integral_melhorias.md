# Lista de Tarefas: Implementação Integral de Melhorias Gyul Hap (Maio 2025)

Este documento detalha o planejamento para a implementação integral de todas as melhorias solicitadas para o jogo Gyul Hap, com base no arquivo `pasted_content.txt` e utilizando o código do `gyul_hap_game_improved_final_v2.zip` como ponto de partida. O projeto será desenvolvido em `/home/ubuntu/gyul_hap_final_project/`.

**Nota:** A melhoria "Testes de Usabilidade com Jogadores Reais" não pode ser executada diretamente por uma IA. Serão implementadas melhorias baseadas em heurísticas de usabilidade e o projeto será estruturado para facilitar testes futuros por humanos.

## Fase 1: Fundações e Melhorias de Baixo Nível

- [X] 1. **Otimização de Performance Contínua (Análise Inicial e Preparação):**
    - [X] 1.1. Revisar o código existente em `/home/ubuntu/gyul_hap_final_project/` para identificar gargalos de performance óbvios (renderizações excessivas, cálculos pesados no loop principal).
    - [X] 1.2. Configurar ferramentas de profiling do navegador para uso durante o desenvolvimento das novas funcionalidades.
    - [X] 1.3. Documentar áreas que podem necessitar de otimização mais profunda posteriormente.
- [X] 2. **Testes Automatizados (Expansão da Base Existente):**
    - [X] 2.1. Analisar a cobertura de testes atual (se houver testes unitários no projeto base v2).
    - [X] 2.2. Expandir testes unitários para `src/lib/gameLogic.js` e `src/lib/cardUtils.js` para cobrir a lógica existente de forma mais completa, incluindo a configuração de timer já implementada na v3 (que será a base, mas o usuário forneceu v2, então preciso verificar qual versão está em `/home/ubuntu/gyul_hap_final_project/` e adaptar. Assumindo que a v2 foi extraída, a configuração do timer precisará ser reimplementada ou portada).
    - [X] 2.3. Adicionar testes para as funções de utilidade e lógica de cartas.
- [X] 3. **Internacionalização (i18n) - Estrutura Inicial:**
    - [X] 3.1. Escolher uma abordagem para i18n (ex: `react-i18next` ou uma solução customizada simples com arquivos JSON).
    - [X] 3.2. Instalar dependências, se necessário.
    - [X] 3.3. Criar estrutura de arquivos para as traduções (ex: `public/locales/en/translation.json`, `public/locales/pt/translation.json`).
    - [X] 3.4. Refatorar algumas strings de texto chave existentes na UI (mensagens, botões) para usar o sistema de i18n (Português como idioma padrão e Inglês como segundo idioma inicial).
    - [X] 3.5. Implementar um seletor de idioma simples na interface (ex: no menu de configurações ou no cabeçalho).

## Fase 2: Melhorias na Configuração e Experiência do Usuário

- [X] 4. **Configuração do Jogo Expandida:**
    - [X] 4.1. **Duração do Timer:** Revisar e garantir que a funcionalidade de configuração do timer (implementada na v3, mas o usuário forneceu v2 como base) esteja presente e funcional, incluindo persistência no `localStorage`.
    - [X] 4.2. **Número de Rodadas:**
        - [X] 4.2.1. Adicionar uma opção na UI de configurações para o usuário definir o número de rodadas (ex: 5, 10, 15, Ilimitado).
        - [X] 4.2.2. Modificar `src/lib/gameLogic.js` para usar o número de rodadas configurado para determinar o fim do jogo.
        - [X] 4.2.3. Salvar a preferência no `localStorage`.
    - [ ] 4.3. **Temas Visuais (Opcional - Avaliar Complexidade):**
        - [ ] 4.3.1. Pesquisar a viabilidade de implementar temas CSS simples (ex: claro/escuro, ou variações de cor primária).
        - [ ] 4.3.2. Se viável, adicionar uma opção na UI de configurações para seleção de tema.
        - [ ] 4.3.3. Implementar a lógica de troca de classes CSS no elemento raiz ou container principal.
- [X] 5. **Novos Efeitos Sonoros e Música de Fundo:**
    - [X] 5.1. **Música de Fundo:**
        - [X] 5.1.1. Selecionar 1-2 faixas de música de fundo adequadas (royalty-free ou criadas).
        - [X] 5.1.2. Adicionar os arquivos à `public/sounds/`.
        - [X] 5.1.3. Atualizar `src/lib/useSound.js` para carregar, tocar (em loop), pausar e controlar o volume da música de fundo.
        - [X] 5.1.4. Adicionar um botão de controle para a música de fundo na UI (separado do mudo geral de efeitos sonoros).
    - [X] 5.2. **Expandir Biblioteca de Efeitos Sonoros:**
        - [X] 5.2.1. Identificar eventos no jogo que poderiam se beneficiar de novos sons (ex: início de rodada, alerta de último Hap, contagem regressiva mais proeminente do timer).
        - [X] 5.2.2. Adicionar e integrar esses novos sons.
- [X] 6. **Refinamento das Animações:**
    - [X] 6.1. Revisar as animações existentes para feedback de acerto/erro, revelação de cartas.
    - [X] 6.2. Melhorar a animação de alerta visual do timer (ex: piscar mais evidente, mudança de cor progressiva nos últimos segundos – verificar se já foi feito na v3 e aprimorar se necessário).
    - [ ] 6.3. Considerar o uso de uma biblioteca leve de animação (como Framer Motion, se o impacto no tamanho do bundle for aceitável) para transições de tela ou animações de UI mais complexas, caso necessário para o tutorial ou modos de jogo.
    - [X] 6.4. Adicionar animações sutis para interações como seleção de cartas ou botões, se não sobrecarregarem a performance.

## Fase 3: Funcionalidades Maiores

- [X] 7. **Tutorial Interativo:**
    - [X] 7.1. Planejar o fluxo do tutorial: o que precisa ser ensinado (conceito de Hap, como selecionar cartas, como chamar Gyul, interface do jogo, timer).
    - [X] 7.2. Escolher o formato: série de modais, dicas contextuais (tooltips) que aparecem na primeira jogada, ou um modo de jogo "Tutorial". (Modal implementado)
    - [X] 7.3. Implementar os componentes de UI para o tutorial.
    - [X] 7.4. Implementar a lógica para controlar a exibição e progressão do tutorial (ex: salvar no `localStorage` se o tutorial foi concluído).
    - [X] 7.5. Garantir que o tutorial utilize o sistema de i18n.
- [X] 8. **Modos de Jogo Adicionais (Implementar um inicialmente, depois avaliar outros):**
    - [X] 8.1. **Modo Solo Contra o Tempo (Primeira Prioridade):**
        - [X] 8.1.1. Definir regras: jogador único, objetivo de encontrar o máximo de Haps em um tempo limite total (ex: 3-5 minutos), ou quantos Haps conseguir antes que o tabuleiro não tenha mais Haps e não haja como repor.
        - [X] 8.1.2. Adaptar `src/lib/gameLogic.js` ou criar uma nova lógica para este modo.
        - [X] 8.1.3. Criar UI específica para este modo (ex: display de score diferente, timer geral do modo).
        - [X] 8.1.4. Adicionar seleção de modo de jogo na tela inicial ou menu de configurações.
    - [ ] 8.2. **Desafios Diários (Avaliar Complexidade - pode exigir backend):**
        - [ ] 8.2.1. Se for um desafio com um tabuleiro fixo por dia, pode ser gerado por um seed ou algoritmo no frontend. Se envolver persistência entre usuários, é mais complexo.
    - [ ] 8.3. **Diferentes Conjuntos de Cartas (Avaliar Complexidade):**
        - [ ] 8.3.1. Definir como seriam esses conjuntos (ex: mais atributos, menos atributos, apenas formas geométricas diferentes).
        - [ ] 8.3.2. Impactaria significativamente `src/lib/cardUtils.js` e a lógica de `is_hap`.
## Fase 4: Funcionalidades Avançadas e Finalização

- [X] 9. **Placares Online (Leaderboards) - Versão Local Simplificada Inicialmente:**
    - [X] 9.1. Para evitar a complexidade de um backend, implementar um leaderboard local salvo no `localStorage`.
    - [X] 9.2. Registrar pontuações (ex: para o modo solo contra o tempo, ou melhor pontuação no modo normal).
    - [X] 9.3. Criar uma UI para exibir o leaderboard local (ex: Top 10 pontuações com nome do jogador – solicitar nome ao final da partida).
    - [ ] 9.4. (Opcional Avançado) Pesquisar serviços de backend simples (BaaS como Firebase) se um leaderboard online for estritamente necessário e viável.
- [X] 10. **Otimização de Performance Contínua (Revisão Final):**
    - [X] 10.1. Após a implementação de todas as funcionalidades, realizar uma rodada de profiling de performance no navegador.
    - [X] 10.2. Otimizar componentes React (uso de `React.memo`, `useCallback`, `useMemo`), reduzir renderizações desnecessárias.
    - [X] 10.3. Otimizar a manipulação de arrays/objetos na lógica do jogo.
- [X] 11. **Testes Automatizados (Cobertura Final):**
    - [X] 11.1. Escrever testes unitários e de integração para as novas funcionalidades (novos modos de jogo, tutorial, i18n, leaderboard local).
    - [X] 11.2. Buscar aumentar a cobertura geral dos testes.

## Fase 5: Testes Manuais, Documentação e Entrega

- [ ] 12. **Testes Manuais Abrangentes:**
    - [ ] 12.1. Testar todas as funcionalidades em diferentes navegadores (Chrome, Firefox) e dispositivos (simulados).
    - [ ] 12.2. Testar a usabilidade da interface, clareza das instruções (tutorial, i18n).
    - [ ] 12.3. Verificar a correta execução de animações, sons, música de fundo e seus controles.
    - [ ] 12.4. Testar todas as opções de configuração.
    - [ ] 12.5. Testar os diferentes modos de jogo.
- [ ] 13. **Validação de Sintaxe Final:**
    - [ ] 13.1. Executar `npm run lint` (ou comando similar) e corrigir erros críticos. Documentar avisos não críticos.
- [ ] 14. **Atualização da Documentação:**
    - [ ] 14.1. Atualizar o `README.md` com instruções detalhadas de configuração, build e execução, e descrição de todas as novas funcionalidades.
    - [ ] 14.2. Atualizar/Criar um `RELATORIO_FINAL_INTEGRAL_GYUL_HAP.md` detalhando todo o processo de desenvolvimento desta fase, arquitetura das novas funcionalidades, desafios, soluções, limitações conhecidas e sugestões futuras.
- [ ] 15. **Preparação do Pacote Final:**
    - [ ] 15.1. Gerar o arquivo zip final do projeto (ex: `gyul_hap_integral_final.zip`), excluindo `node_modules`, arquivos de lock e outros artefatos de build desnecessários.
- [ ] 16. **Entrega ao Usuário:**
    - [ ] 16.1. Enviar mensagem ao usuário com o zip, relatório e `todo.md` finalizado.

