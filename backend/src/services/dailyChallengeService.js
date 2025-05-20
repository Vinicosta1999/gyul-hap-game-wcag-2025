const crypto = require("crypto");

// Gera um seed para o desafio diário.
// Pode ser uma string aleatória ou baseada na data para consistência se não for armazenado.
function generateDailySeed() {
  // Usar a data atual (YYYY-MM-DD) como parte do seed para garantir que seja único por dia,
  // mesmo que o job agendado falhe e seja chamado múltiplas vezes no mesmo dia.
  const today = new Date().toISOString().split("T")[0];
  return crypto.createHash("sha256").update(today + process.env.DAILY_SEED_SECRET || "default_secret").digest("hex");
}

// No futuro, esta função poderia calcular o número de soluções para um dado seed.
// Por agora, é um placeholder.
// function calculateSolutionsForSeed(seed) {
//   // Lógica complexa para determinar o número de Haps em um tabuleiro gerado por este seed.
//   // Isso exigiria a lógica de geração de tabuleiro do frontend (ou uma reimplementação dela no backend).
//   return 0; 
// }

module.exports = {
  generateDailySeed,
  // calculateSolutionsForSeed
};

