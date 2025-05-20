// /home/ubuntu/gyul_hap_full_stack_wcag_project/backend/src/services/logger.js
const winston = require("winston");

// Define o formato do log
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Cria um logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info", // Nível de log (pode ser configurado via variável de ambiente)
  format: logFormat,
  transports: [
    // Log para o console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Adiciona cores ao console
        logFormat
      )
    }),
    // Log para um arquivo (opcional, mas recomendado para produção)
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error", // Apenas erros neste arquivo
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
    new winston.transports.File({
      filename: "logs/combined.log", // Todos os logs neste arquivo
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
  exitOnError: false, // Não sair em erros não tratados
});

// Adiciona um stream para Morgan (se Morgan for usado para logs HTTP)
logger.stream = {
  write: function(message, encoding){
    logger.info(message.trim());
  }
};

module.exports = logger;

