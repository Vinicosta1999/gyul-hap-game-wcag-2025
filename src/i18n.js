import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: process.env.NODE_ENV === "development",
    fallbackLng: "pt",
    interpolation: {
      escapeValue: false, 
    },
    resources: {
      en: {
        translation: {
          // Classic Mode Messages
          message_player_1_turn: "Player 1: Your turn!",
          message_player_2_turn: "Player 2: Your turn!",
          message_timer_expired_player_1: "Time up for Player 1! Penalty: {{penalty}} point. Player 2\'s turn.",
          message_timer_expired_player_2: "Time up for Player 2! Penalty: {{penalty}} point. Player 1\'s turn.",
          message_player_1_found_hap: "Player 1 found a Hap! +{{points}} point. Your turn again.",
          message_player_2_found_hap: "Player 2 found a Hap! +{{points}} point. Your turn again.",
          message_not_hap_player_1: "Not a Hap! {{points}} point. Player 2\'s turn.",
          message_not_hap_player_2: "Not a Hap! {{points}} point. Player 1\'s turn.",
          message_player_1_selected_cards: "Player 1 selected {{count}} card(s).",
          message_player_2_selected_cards: "Player 2 selected {{count}} card(s).",
          message_player_1_gyul_correct: "Player 1 called Gyul correctly! +{{points}} points. End of Round {{round}}.",
          message_player_2_gyul_correct: "Player 2 called Gyul correctly! +{{points}} points. End of Round {{round}}.",
          message_starting_round: " Starting Round {{nextRound}}. Player {{nextPlayer}}\'s turn.",
          message_gyul_incorrect_player_1: "Incorrect Gyul by Player 1! {{points}} point. {{remainingHaps}} Hap(s) remaining. Player 2\'s turn.",
          message_gyul_incorrect_player_2: "Incorrect Gyul by Player 2! {{points}} point. {{remainingHaps}} Hap(s) remaining. Player 1\'s turn.",
          message_game_over_draw: "Game Over! It\'s a Draw!",
          message_game_over_player_1_wins: "Game Over! Player 1 Wins!",
          message_game_over_player_2_wins: "Game Over! Player 2 Wins!",
          
          // Solo Mode & Daily Challenge Messages
          message_solo_start: "Solo Time Attack! Find as many Haps as you can!",
          message_daily_start: "Daily Challenge! Find Haps with today\'s unique board!",
          message_solo_hap_found: "Hap found! +1 point!",
          message_solo_not_hap: "Not a Hap! -1 point.",
          message_solo_selected_cards: "Selected {{count}} card(s).",
          message_solo_time_up_game_over: "Time\'s up! Game Over. Final Score: {{score}}",
          message_solo_no_more_haps_game_over: "No more Haps on board and deck is empty! Game Over. Final Score: {{score}}",
          message_daily_completed_already: "You have already completed today\'s Daily Challenge. Try again tomorrow! Score: {{score}}",

          // UI Elements
          gyul_hap_title: "GYUL! HAP!",
          mute_button_sound_on: "Mute FX",
          mute_button_sound_off: "Unmute FX",
          scoreboard_round: "Round: {{round}}",
          scoreboard_time: "Time: {{timeValue}}s",
          scoreboard_solo_time: "Total Time: {{timeValue}}s",
          scoreboard_solo_score: "Score: {{score}}",
          player_panel_player_1: "Player 1",
          player_panel_player_2: "Player 2",
          player_panel_call_gyul: "Call GYUL!",
          game_over_play_again: "Play Again?",
          settings_title: "Game Settings",
          settings_game_mode: "Game Mode:",
          settings_mode_classic: "Classic (2 Players)",
          settings_mode_solo: "Solo Time Attack",
          settings_mode_daily_challenge: "Daily Challenge",
          settings_daily_completed: "Completed",
          settings_daily_already_completed: "Daily Challenge Completed!",
          settings_daily_fixed_time: "Fixed Time",
          settings_daily_fixed_card_set: "Fixed Card Set (Default)",
          settings_timer_duration: "Move Timer (Classic):",
          settings_timer_duration_solo: "Total Time (Solo/Daily):",
          settings_timer_duration_default: " (Default)",
          settings_timer_option_off: "OFF",
          settings_rounds_number: "Number of Rounds (Classic):",
          settings_rounds_unlimited: "Unlimited",
          settings_card_set: "Card Set:",
          settings_start_game_button: "Start Game",
          settings_button_label: "⚙️ Settings",
          toggle_music_on: "Music ON",
          toggle_music_off: "Music OFF",
          language_selector_label: "Language:",
          settings_theme_label: "Theme:",
          settings_theme_light: "Light Theme",
          settings_theme_dark: "Dark Theme",
          settings_theme_light_icon: "☀️ Light",
          settings_theme_dark_icon: "🌙 Dark",
          tutorial_button_label: "How to Play?",
          leaderboard_title: "Leaderboard (Top 10)",
          leaderboard_empty: "No scores yet. Play a game!",
          leaderboard_clear_button: "Clear Leaderboard",
          name_input_placeholder: "Enter your name for leaderboard",
          name_input_submit_button: "Save Score",
          name_input_label: "Enter your name",
          daily_challenge_title: "Today\'s Challenge",

          // Tutorial Modal (Simplified for brevity, assume existing detailed translations)
          tutorial_modal_title: "How to Play Gyul Hap",
          tutorial_objective_title: "Objective",
          tutorial_objective_text: "Find sets of three cards, called \'Haps\'. Modes: Classic (2P), Solo Time Attack, Daily Challenge.",
          // ... other tutorial keys ...
          tutorial_game_modes_title: "Game Modes",
          tutorial_classic_mode_text: "Two players compete for points.",
          tutorial_solo_mode_text: "Single player against time.",
          tutorial_daily_challenge_text: "Single player, unique daily board, compete for best score.",
          tutorial_close_button: "Close"
        }
      },
      pt: {
        translation: {
          // Classic Mode Messages
          message_player_1_turn: "Jogador 1: Sua vez!",
          message_player_2_turn: "Jogador 2: Sua vez!",
          message_timer_expired_player_1: "Tempo esgotado para Jogador 1! Penalidade: {{penalty}} ponto. Vez do Jogador 2.",
          message_timer_expired_player_2: "Tempo esgotado para Jogador 2! Penalidade: {{penalty}} ponto. Vez do Jogador 1.",
          message_player_1_found_hap: "Jogador 1 achou um Hap! +{{points}} ponto. Sua vez novamente.",
          message_player_2_found_hap: "Jogador 2 achou um Hap! +{{points}} ponto. Sua vez novamente.",
          message_not_hap_player_1: "Não é Hap! {{points}} ponto. Vez do Jogador 2.",
          message_not_hap_player_2: "Não é Hap! {{points}} ponto. Vez do Jogador 1.",
          message_player_1_selected_cards: "Jogador 1 selecionou {{count}} carta(s).",
          message_player_2_selected_cards: "Jogador 2 selecionou {{count}} carta(s).",
          message_player_1_gyul_correct: "Jogador 1 chamou Gyul corretamente! +{{points}} pontos. Fim da Rodada {{round}}.",
          message_player_2_gyul_correct: "Jogador 2 chamou Gyul corretamente! +{{points}} pontos. Fim da Rodada {{round}}.",
          message_starting_round: " Iniciando Rodada {{nextRound}}. Vez do Jogador {{nextPlayer}}.",
          message_gyul_incorrect_player_1: "Gyul incorreto do Jogador 1! {{points}} ponto. {{remainingHaps}} Hap(s) restantes. Vez do Jogador 2.",
          message_gyul_incorrect_player_2: "Gyul incorreto do Jogador 2! {{points}} ponto. {{remainingHaps}} Hap(s) restantes. Vez do Jogador 1.",
          message_game_over_draw: "Fim de Jogo! Empate!",
          message_game_over_player_1_wins: "Fim de Jogo! Jogador 1 Venceu!",
          message_game_over_player_2_wins: "Fim de Jogo! Jogador 2 Venceu!",

          // Solo Mode & Daily Challenge Messages
          message_solo_start: "Modo Solo Contra o Tempo! Encontre o máximo de Haps!",
          message_daily_start: "Desafio Diário! Encontre Haps no tabuleiro único de hoje!",
          message_solo_hap_found: "Hap encontrado! +1 ponto!",
          message_solo_not_hap: "Não é Hap! -1 ponto.",
          message_solo_selected_cards: "Selecionou {{count}} carta(s).",
          message_solo_time_up_game_over: "Tempo Esgotado! Fim de Jogo. Pontuação Final: {{score}}",
          message_solo_no_more_haps_game_over: "Sem mais Haps no tabuleiro e baralho vazio! Fim de Jogo. Pontuação Final: {{score}}",
          message_daily_completed_already: "Você já completou o Desafio Diário de hoje. Tente novamente amanhã! Pontuação: {{score}}",
          
          // UI Elements
          gyul_hap_title: "GYUL! HAP!",
          mute_button_sound_on: "Silenciar FX",
          mute_button_sound_off: "Ativar FX",
          scoreboard_round: "Rodada: {{round}}",
          scoreboard_time: "Tempo Jogada: {{timeValue}}s",
          scoreboard_solo_time: "Tempo Total: {{timeValue}}s",
          scoreboard_solo_score: "Pontuação: {{score}}",
          player_panel_player_1: "Jogador 1",
          player_panel_player_2: "Jogador 2",
          player_panel_call_gyul: "Chamar GYUL!",
          game_over_play_again: "Jogar Novamente?",
          settings_title: "Configurações do Jogo",
          settings_game_mode: "Modo de Jogo:",
          settings_mode_classic: "Clássico (2 Jogadores)",
          settings_mode_solo: "Solo Contra o Tempo",
          settings_mode_daily_challenge: "Desafio Diário",
          settings_daily_completed: "Concluído",
          settings_daily_already_completed: "Desafio Diário Concluído!",
          settings_daily_fixed_time: "Tempo Fixo",
          settings_daily_fixed_card_set: "Conjunto de Cartas Fixo (Padrão)",
          settings_timer_duration: "Timer por Jogada (Clássico):",
          settings_timer_duration_solo: "Tempo Total (Solo/Diário):",
          settings_timer_duration_default: " (Padrão)",
          settings_timer_option_off: "DESLIGADO",
          settings_rounds_number: "Número de Rodadas (Clássico):",
          settings_rounds_unlimited: "Ilimitado",
          settings_card_set: "Conjunto de Cartas:",
          settings_start_game_button: "Iniciar Jogo",
          settings_button_label: "⚙️ Configurações",
          toggle_music_on: "Música LIGADA",
          toggle_music_off: "Música DESLIGADA",
          language_selector_label: "Idioma:",
          settings_theme_label: "Tema:",
          settings_theme_light: "Tema Claro",
          settings_theme_dark: "Tema Escuro",
          settings_theme_light_icon: "☀️ Claro",
          settings_theme_dark_icon: "🌙 Escuro",
          tutorial_button_label: "Como Jogar?",
          leaderboard_title: "Placar (Top 10)",
          leaderboard_empty: "Nenhuma pontuação ainda. Jogue uma partida!",
          leaderboard_clear_button: "Limpar Placar",
          name_input_placeholder: "Digite seu nome para o placar",
          name_input_submit_button: "Salvar Pontuação",
          name_input_label: "Digite seu nome",
          daily_challenge_title: "Desafio de Hoje",

          // Tutorial Modal (Simplified for brevity, assume existing detailed translations)
          tutorial_modal_title: "Como Jogar Gyul Hap",
          tutorial_objective_title: "Objetivo",
          tutorial_objective_text: "Encontre conjuntos de três cartas, chamados \'Haps\'. Modos: Clássico (2J), Solo Contra o Tempo, Desafio Diário.",
          // ... other tutorial keys ...
          tutorial_game_modes_title: "Modos de Jogo",
          tutorial_classic_mode_text: "Dois jogadores competem por pontos.",
          tutorial_solo_mode_text: "Jogador único contra o tempo.",
          tutorial_daily_challenge_text: "Jogador único, tabuleiro diário único, compita pela melhor pontuação.",
          tutorial_close_button: "Fechar"
        }
      }
    }
  });

export default i18n;

