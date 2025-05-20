// /home/ubuntu/gyul_hap_full_stack_wcag_project/backend/tests/integration/auth.test.js

const request = require("supertest");
const { sequelize, User } = require("../../src/models"); // sequelize instance from models
const { app, httpServer, io } = require("../../server"); // Import app and httpServer

beforeAll(async () => {
  // Ensure the database is synchronized for the test environment
  // The config/config.json should point to SQLite in-memory for NODE_ENV=test
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  // Clean up database after each test
  await User.destroy({ truncate: true, cascade: true });
});

afterAll(async () => {
  // Close the database connection
  await sequelize.close();
  // Close the Socket.IO server
  await new Promise((resolve) => {
    io.close(() => {
      resolve();
    });
  });
  // Close the HTTP server if it's listening (it shouldn't be in test if server.js is correct)
  // However, supertest might start it implicitly if not handled well.
  // The server.js logic `if (process.env.NODE_ENV !== 'test')` should prevent httpServer.listen().
  // If httpServer was started by supertest or some other means, it needs to be closed.
  // For now, let's assume Jest's --detectOpenHandles and forceExit will manage this if server.js is correct.
  // If open handles persist, we might need to explicitly close httpServer if supertest starts it.
});

describe("Auth Routes", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app) // Use the imported app directly
        .post("/api/auth/register")
        .send({
          username: "testuser",
          password: "password123",
          email: "testuser@example.com",
        });
      expect(res.statusCode).toEqual(200); // Or 201 if you return 201 for creation
      expect(res.body).toHaveProperty("token");
      
      const user = await User.findOne({ where: { username: "testuser" } });
      expect(user).not.toBeNull();
      expect(user.email).toEqual("testuser@example.com");
    });

    it("should return 400 if username already exists", async () => {
      await User.create({ username: "existinguser", password_hash: "somehashedpassword", email: "existing@example.com" });
      
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          username: "existinguser",
          password: "newpassword123",
          email: "newuser@example.com",
        });
      expect(res.statusCode).toEqual(400);
      // Assuming your error response structure is { errors: [{ msg: "..." }] }
      expect(res.body.errors[0].msg).toEqual("Username already exists"); 
    });

    it("should return 400 if email already exists", async () => {
        await User.create({ username: "anotheruser", password_hash: "anotherhashedpassword", email: "existingemail@example.com" });
        const res = await request(app)
            .post("/api/auth/register")
            .send({
                username: "newusername",
                password: "password123",
                email: "existingemail@example.com"
            });
        expect(res.statusCode).toEqual(400);
        expect(res.body.errors[0].msg).toEqual("Email already exists");
    });

    it("should return 400 for invalid input (e.g., short password)", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser2",
          password: "123", // Short password
          email: "testuser2@example.com",
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].msg).toEqual("Password must be at least 6 characters long");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Manually hash password for consistent testing if not relying on hooks for this specific setup
      // Or ensure hooks run by using User.create which triggers them.
      // The User model has a hook to hash password before saving.
      await User.create({ username: "loginuser", password_hash: "password123", email: "login@example.com" });
    });

    it("should login an existing user successfully", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          username: "loginuser",
          password: "password123", // Plain password, controller will hash and compare
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("token");
    });

    it("should return 400 for non-existent username", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          username: "nonexistentuser",
          password: "password123",
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].msg).toEqual("Invalid credentials");
    });

    it("should return 400 for incorrect password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          username: "loginuser",
          password: "wrongpassword",
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].msg).toEqual("Invalid credentials");
    });
  });
});

