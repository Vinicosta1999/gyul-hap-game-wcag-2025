## Testes Unitários para TwoFactorService (Backend - Jest)

Este arquivo demonstra como seriam os testes unitários para o `TwoFactorService.js` utilizando Jest.

```javascript
// __tests__/services/TwoFactorService.test.js

const twoFactorService = require("../../services/TwoFactorService"); // Ajuste o caminho
const speakeasy = require("speakeasy");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// Mock para speakeasy, se necessário para controlar saídas
jest.mock("speakeasy", () => ({
  generateSecret: jest.fn(() => ({ base32: "MOCKSECRETBASE32" })),
  otpauthURL: jest.fn(() => "otpauth://totp/GyulHapApp:test@example.com?secret=MOCKSECRETBASE32&issuer=GyulHapApp&encoding=base32"),
  totp: {
    verify: jest.fn(),
  },
}));

// Mock para bcrypt
jest.mock("bcryptjs", () => ({
  genSalt: jest.fn(() => Promise.resolve("MOCKSALT")),
  hash: jest.fn(() => Promise.resolve("MOCKHASHEDCODE")),
  compare: jest.fn(),
}));

// Mock para crypto.randomBytes, se necessário para códigos de recuperação determinísticos em testes
const mockRandomBytes = Buffer.from("abcdef1234567890", "hex");
jest.spyOn(crypto, "randomBytes").mockImplementation(() => mockRandomBytes);

// Simular a variável de ambiente para a chave de criptografia
process.env.TWO_FACTOR_ENCRYPTION_KEY = "aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899"; // 64 hex chars

describe("TwoFactorService", () => {
  describe("generateUniqueSecret", () => {
    it("should generate a base32 secret using speakeasy", () => {
      const secret = twoFactorService.generateUniqueSecret();
      expect(speakeasy.generateSecret).toHaveBeenCalledWith({ length: 20, name: "GyulHapApp" });
      expect(secret).toBe("MOCKSECRETBASE32");
    });
  });

  describe("generateOtpAuthUrl", () => {
    it("should generate a valid otpauth URL", () => {
      const email = "test@example.com";
      const secret = "MOCKSECRETBASE32";
      const url = twoFactorService.generateOtpAuthUrl(email, secret);
      expect(speakeasy.otpauthURL).toHaveBeenCalledWith({
        secret: secret,
        label: encodeURIComponent(email),
        issuer: "GyulHapApp",
        encoding: "base32",
      });
      expect(url).toBe("otpauth://totp/GyulHapApp:test@example.com?secret=MOCKSECRETBASE32&issuer=GyulHapApp&encoding=base32");
    });
  });

  describe("verifyTotp", () => {
    it("should call speakeasy.totp.verify with correct parameters", () => {
      speakeasy.totp.verify.mockReturnValueOnce(true);
      const result = twoFactorService.verifyTotp("USERSECRET", "123456");
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: "USERSECRET",
        encoding: "base32",
        token: "123456",
        window: 1,
      });
      expect(result).toBe(true);
    });
  });

  describe("generateRecoveryCodes", () => {
    it("should generate the correct number of recovery codes with correct length", () => {
      const codes = twoFactorService.generateRecoveryCodes();
      expect(codes).toHaveLength(10); // NUMBER_OF_RECOVERY_CODES
      codes.forEach(code => {
        expect(code).toHaveLength(10); // RECOVERY_CODE_LENGTH
        expect(crypto.randomBytes).toHaveBeenCalled();
        // Exemplo de código esperado com o mockRandomBytes
        expect(code).toBe("ABCDEF1234"); // (mockRandomBytes.toString("hex").slice(0, 10).toUpperCase())
      });
    });
  });

  describe("hashRecoveryCode and verifyRecoveryCode", () => {
    it("should hash a code and then verify it successfully", async () => {
      const code = "RECOVERY123";
      const hashedCode = await twoFactorService.hashRecoveryCode(code);
      expect(bcrypt.hash).toHaveBeenCalledWith(code, "MOCKSALT");
      expect(hashedCode).toBe("MOCKHASHEDCODE");

      bcrypt.compare.mockResolvedValueOnce(true);
      const isValid = await twoFactorService.verifyRecoveryCode(hashedCode, code);
      expect(bcrypt.compare).toHaveBeenCalledWith(code, hashedCode);
      expect(isValid).toBe(true);
    });

    it("should fail to verify an incorrect code", async () => {
      bcrypt.compare.mockResolvedValueOnce(false);
      const isValid = await twoFactorService.verifyRecoveryCode("MOCKHASHEDCODE", "WRONGCODE");
      expect(isValid).toBe(false);
    });
  });

  describe("encryptSecret and decryptSecret", () => {
    it("should encrypt and then decrypt a secret successfully", () => {
      const originalSecret = "MYTESTSECRET123";
      const encrypted = twoFactorService.encryptSecret(originalSecret);
      expect(encrypted).not.toBe(originalSecret);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
      expect(encrypted.split(":")).toHaveLength(3); // iv:encrypted:authTag

      const decrypted = twoFactorService.decryptSecret(encrypted);
      expect(decrypted).toBe(originalSecret);
    });

    it("should return null if decryption fails due to tampered data (authTag mismatch)", () => {
      const originalSecret = "MYTESTSECRET123";
      let encrypted = twoFactorService.encryptSecret(originalSecret);
      const parts = encrypted.split(":");
      // Tamper with the authTag
      const tamperedAuthTag = Buffer.from(parts[2], "hex");
      tamperedAuthTag[0] = tamperedAuthTag[0] ^ 0xff; // Flip a bit
      encrypted = parts[0] + ":" + parts[1] + ":" + tamperedAuthTag.toString("hex");
      
      const decrypted = twoFactorService.decryptSecret(encrypted);
      expect(decrypted).toBeNull();
    });

    it("should return null for invalid encrypted text format", () => {
      const decrypted = twoFactorService.decryptSecret("invalid:format");
      expect(decrypted).toBeNull();
    });

    it("should handle null input for encryption and decryption", () => {
      expect(twoFactorService.encryptSecret(null)).toBeNull();
      expect(twoFactorService.decryptSecret(null)).toBeNull();
    });
  });
});

```

**Notas sobre este arquivo de teste:**

*   **Mocking:** `speakeasy`, `bcrypt` e `crypto.randomBytes` são mockados para tornar os testes determinísticos e evitar dependências externas reais durante os testes unitários.
*   **`ENCRYPTION_KEY`:** A variável de ambiente é simulada com `process.env` para o escopo do teste.
*   **Cobertura:** Este exemplo cobre as principais funcionalidades do `TwoFactorService`. Testes adicionais podem ser escritos para casos de borda.
*   **Execução:** Este arquivo seria executado pelo Jest (`npx jest TwoFactorService.test.js`).

Este é um exemplo de como os testes unitários para o backend seriam estruturados. A próxima etapa seria criar arquivos de teste semelhantes para outros serviços, controladores e, em seguida, testes de integração para os endpoints da API.
