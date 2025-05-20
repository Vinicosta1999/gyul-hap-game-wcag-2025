// __tests__/integration/auth.2fa.integration.test.js (Atualizado para novo middleware e cookies)

const request = require("supertest");
const { sequelize, User } = require("../../src/models"); // sequelize instance from models
const { app, httpServer, io } = require("../../server"); // Import app and httpServer
const twoFactorService = require("../../src/services/TwoFactorService");
const jwt = require("jsonwebtoken"); // Para gerar tokens de teste

// Variáveis de ambiente para chaves JWT (devem ser as mesmas usadas no app)
process.env.JWT_ACCESS_SECRET = "your_jwt_access_secret_for_testing";
process.env.JWT_REFRESH_SECRET = "your_jwt_refresh_secret_for_testing";
process.env.TWO_FACTOR_ENCRYPTION_KEY = "aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899";

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  // Limpar usuários após cada teste para evitar conflitos, mas não o banco inteiro se não for necessário
  // A limpeza do banco de dados inteiro (truncate: true, cascade: true) é feita no beforeEach principal da suíte
});

afterAll(async () => {
  await sequelize.close();
  await new Promise((resolve) => {
    io.close(() => {
      resolve();
    });
  });
  // Se o httpServer foi iniciado explicitamente (o que não deveria ser o caso em testes se server.js estiver correto),
  // ele precisaria ser fechado aqui. No entanto, o server.js já previne o listen em ambiente de teste.
});


// Helper para limpar o banco de dados (especificamente a tabela User)
beforeEach(async () => {
  await User.destroy({ where: {}, truncate: true, cascade: true });
});

// Mock para twoFactorService.verifyTotp
const verifyTotpMock = jest.spyOn(twoFactorService, "verifyTotp");

// Helper para gerar um accessToken de teste
const generateTestAccessToken = (userPayload, expiresIn = "15m") => {
  return jwt.sign({ user: userPayload }, process.env.JWT_ACCESS_SECRET, { expiresIn });
};

describe("Auth & 2FA Endpoints Integration Tests with Cookie-Based Auth", () => {
  let testUserCredentials = {
    username: "testuser2fa", // Username diferente para evitar conflitos com auth.test.js se executados no mesmo contexto de BD sem limpeza total
    email: "test2fa@example.com",
    password: "Password123!",
  };
  let agent; // Supertest agent para persistir cookies

  beforeEach(() => {
    agent = request.agent(app); // Novo agente para cada suíte de describe principal ou teste
    verifyTotpMock.mockClear(); // Limpar mocks entre os testes
  });

  describe("User Registration and Login (No 2FA)", () => {
    it("should register a new user successfully", async () => {
      const res = await agent
        .post("/api/auth/register")
        .send(testUserCredentials);
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("message", "User registered successfully");
      const userInDb = await User.findOne({ where: { email: testUserCredentials.email } });
      expect(userInDb).not.toBeNull();
    });

    it("should login a user successfully and set HttpOnly cookies", async () => {
      await agent.post("/api/auth/register").send(testUserCredentials); // Registrar primeiro
      const res = await agent
        .post("/api/auth/login")
        .send({ email: testUserCredentials.email, password: testUserCredentials.password });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe(testUserCredentials.email);
      const cookies = res.headers["set-cookie"];
      expect(cookies).toEqual(expect.arrayContaining([
        expect.stringMatching(/accessToken=.+; Path=\/; HttpOnly; SameSite=Strict/),
        expect.stringMatching(/refreshToken=.+; Path=\/api\/auth\/refresh-token; HttpOnly; SameSite=Strict/)
      ]));
    });
  });

  describe("Protected Route Access with Cookies", () => {
    let loggedInUser;

    beforeEach(async () => {
      // Registrar e logar para obter cookies e usuário
      await agent.post("/api/auth/register").send(testUserCredentials);
      const loginRes = await agent
        .post("/api/auth/login")
        .send({ email: testUserCredentials.email, password: testUserCredentials.password });
      loggedInUser = loginRes.body.user;
    });

    it("should access a protected route (e.g., /api/auth/2fa/setup) with valid accessToken cookie", async () => {
      const res = await agent.post("/api/auth/2fa/setup").send();
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("secret");
    });

    it("should be denied access to a protected route if no accessToken cookie is present", async () => {
      const freshAgent = request.agent(app); // Novo agente sem cookies
      const res = await freshAgent.post("/api/auth/2fa/setup").send();
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("message", "No token provided, authorization denied.");
    });

    it("should be denied access with an invalid accessToken cookie", async () => {
      const freshAgent = request.agent(app);
      const res = await freshAgent
        .post("/api/auth/2fa/setup")
        .set("Cookie", "accessToken=invalidtoken123")
        .send();
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("message", "Token is not valid.");
      expect(res.body).toHaveProperty("code", "INVALID_TOKEN");
    });

    it("should be denied access with an expired accessToken cookie", async () => {
      const expiredToken = generateTestAccessToken({ id: loggedInUser.id, email: loggedInUser.email }, "1ms"); // Tempo de expiração muito curto
      await new Promise(resolve => setTimeout(resolve, 50)); // Esperar o token expirar
      
      const freshAgent = request.agent(app);
      const res = await freshAgent
        .post("/api/auth/2fa/setup")
        .set("Cookie", `accessToken=${expiredToken}`)
        .send();
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("message", "Access token expired.");
      expect(res.body).toHaveProperty("code", "TOKEN_EXPIRED");
    });
  });

  describe("2FA Flow Integration Tests with Cookies", () => {
    let createdUser;

    beforeEach(async () => {
      await agent.post("/api/auth/register").send(testUserCredentials);
      const loginRes = await agent.post("/api/auth/login").send({ email: testUserCredentials.email, password: testUserCredentials.password });
      // É crucial pegar o ID do usuário do banco de dados após o registro/login para garantir consistência
      const userFromDb = await User.findOne({ where: { email: testUserCredentials.email } });
      expect(userFromDb).not.toBeNull();
      createdUser = userFromDb; 
    });

    it("should initiate 2FA setup successfully", async () => {
      const res = await agent.post("/api/auth/2fa/setup").send();
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("secret");
      const userInDb = await User.findByPk(createdUser.id);
      expect(userInDb.tempTwoFactorSecret).toBe(res.body.secret);
    });

    it("should verify TOTP and enable 2FA successfully", async () => {
      await agent.post("/api/auth/2fa/setup").send(); // Inicia o setup para ter tempTwoFactorSecret
      verifyTotpMock.mockReturnValueOnce(true); // Mock para o TOTP ser válido
      const totpToken = "123456"; // Token de teste

      const res = await agent.post("/api/auth/2fa/verify-setup").send({ totpToken });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "2FA enabled successfully! Store these recovery codes safely.");
      expect(res.body.recoveryCodes).toBeInstanceOf(Array);
      expect(res.body.recoveryCodes.length).toBeGreaterThan(0);
      const userInDb = await User.findByPk(createdUser.id);
      expect(userInDb.isTwoFactorEnabled).toBe(true);
      expect(userInDb.twoFactorSecret).not.toBeNull();
      expect(userInDb.tempTwoFactorSecret).toBeNull(); // Deve ser limpo após setup
    });

    describe("Login with 2FA enabled (Cookie Flow)", () => {
      beforeEach(async () => {
        // Habilitar 2FA para o usuário desta suíte de testes
        await agent.post("/api/auth/2fa/setup").send();
        verifyTotpMock.mockReturnValueOnce(true);
        await agent.post("/api/auth/2fa/verify-setup").send({ totpToken: "123456" });
        // Logout para simular um novo login que exigirá 2FA
        await agent.post("/api/auth/logout").send();
      });

      it("should require 2FA after primary login and return userId", async () => {
        const loginRes = await agent.post("/api/auth/login").send({ email: testUserCredentials.email, password: testUserCredentials.password });
        expect(loginRes.statusCode).toEqual(200); 
        expect(loginRes.body).toHaveProperty("message", "2FA verification required");
        expect(loginRes.body).toHaveProperty("userId", createdUser.id);
        expect(loginRes.body.twoFactorRequired).toBe(true);
        const cookies = loginRes.headers["set-cookie"];
        if (cookies) {
            expect(cookies.find(c => c.startsWith("accessToken="))).toBeUndefined();
        }
      });

      it("should login successfully with a valid TOTP token after primary login", async () => {
        const loginRes = await agent.post("/api/auth/login").send({ email: testUserCredentials.email, password: testUserCredentials.password });
        expect(loginRes.body.twoFactorRequired).toBe(true);
        const userIdFor2FA = loginRes.body.userId;

        verifyTotpMock.mockReturnValueOnce(true);
        const res = await agent.post("/api/auth/2fa/authenticate").send({ userId: userIdFor2FA, totpToken: "654321" });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("message", "2FA successful. Logged in.");
        expect(res.body).toHaveProperty("user");
        const finalCookies = res.headers["set-cookie"];
        expect(finalCookies).toEqual(expect.arrayContaining([
            expect.stringMatching(/accessToken=.+; Path=\/; HttpOnly; SameSite=Strict/),
            expect.stringMatching(/refreshToken=.+; Path=\/api\/auth\/refresh-token; HttpOnly; SameSite=Strict/)
        ]));
      });
    });

    it("should disable 2FA successfully", async () => {
        await agent.post("/api/auth/2fa/setup").send();
        verifyTotpMock.mockReturnValueOnce(true);
        await agent.post("/api/auth/2fa/verify-setup").send({ totpToken: "123456" });

        const res = await agent.post("/api/auth/2fa/disable").send();
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("message", "2FA has been disabled successfully.");
        const userInDb = await User.findByPk(createdUser.id);
        expect(userInDb.isTwoFactorEnabled).toBe(false);
        expect(userInDb.twoFactorSecret).toBeNull();
    });
  });
});

