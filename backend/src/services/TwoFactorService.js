// /home/ubuntu/gyul_hap_full_stack_wcag_project/backend/src/services/TwoFactorService.js

const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const crypto = require("crypto");

// Chave de criptografia para os segredos 2FA armazenados no banco de dados.
// IMPORTANTE: Esta chave deve ser armazenada de forma segura, por exemplo, em variáveis de ambiente.
// E deve ser uma string de 32 bytes (256 bits) para AES-256.
const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || "aabbccddeeff00112233445566778899"; // Chave de 32 bytes
const IV_LENGTH = 16; // Para AES, o IV é geralmente de 16 bytes (128 bits)

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text) {
  if (!text) return null;
  try {
    const textParts = text.split(":");
    if (textParts.length !== 2) {
        console.error("Decrypt Error: Invalid encrypted text format");
        return null; 
    }
    const iv = Buffer.from(textParts.shift(), "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error("Decrypt Error:", error.message);
    return null; // Retorna null se a descriptografia falhar (ex: chave errada, dados corrompidos)
  }
}

const generateSecret = () => {
  const secret = speakeasy.generateSecret({ length: 20 });
  return {
    base32: secret.base32, // Segredo para o usuário (para inserir manualmente)
    otpauth_url: secret.otpauth_url, // URL para o QR Code
  };
};

const generateOtpAuthUrl = (label, issuer, secret) => {
  return speakeasy.otpauthURL({
    secret: secret,
    label: encodeURIComponent(label), // Geralmente o email ou username do usuário
    issuer: encodeURIComponent(issuer), // Nome da sua aplicação
    encoding: "base32",
  });
};

const generateQrCode = async (otpAuthUrl) => {
  try {
    return await QRCode.toDataURL(otpAuthUrl);
  } catch (err) {
    console.error("Error generating QR code", err);
    return null;
  }
};

const verifyTotp = (secret, token, window = 1) => {
  if (!secret || !token) return false;
  const decryptedSecret = decrypt(secret); // O segredo armazenado no BD deve ser descriptografado primeiro
  if (!decryptedSecret) {
    console.error("Failed to decrypt 2FA secret for verification.");
    return false;
  }
  return speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: "base32",
    token: token,
    window: window, // Permite uma pequena variação de tempo (1 período de 30s para frente ou para trás)
  });
};

const generateRecoveryCodes = (count = 10, length = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length));
  }
  return codes;
};

module.exports = {
  generateSecret,
  generateOtpAuthUrl,
  generateQrCode,
  verifyTotp,
  encrypt,
  decrypt,
  generateRecoveryCodes,
};

