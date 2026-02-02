import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { createMockPrisma, createMockJoke } from "./helpers.js";

describe("App", () => {
  describe("createApp", () => {
    it("should create an Express application", () => {
      const mockPrisma = createMockPrisma();
      const app = createApp(mockPrisma);

      expect(app).toBeDefined();
      expect(typeof app.listen).toBe("function");
    });
  });

  describe("GET /", () => {
    it("should return welcome message", async () => {
      const mockPrisma = createMockPrisma();
      const app = createApp(mockPrisma);

      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.text).toBe("Hi Twilio! Node and express server running");
    });
  });

  describe("Middleware", () => {
    it("should parse JSON request bodies", async () => {
      const mockPrisma = createMockPrisma();
      const mockJoke = createMockJoke({ text: "test" });
      vi.mocked(mockPrisma.joke.create).mockResolvedValue(mockJoke);
      const app = createApp(mockPrisma);

      const response = await request(app)
        .post("/jokes")
        .set("Content-Type", "application/json")
        .send(JSON.stringify({ text: "test" }));

      // Should process the request successfully with mocked prisma
      expect(response.status).toBe(201);
    });

    it("should parse URL-encoded request bodies", async () => {
      const mockPrisma = createMockPrisma();
      const mockJoke = createMockJoke({ text: "test" });
      vi.mocked(mockPrisma.joke.create).mockResolvedValue(mockJoke);
      const app = createApp(mockPrisma);

      const response = await request(app)
        .post("/jokes")
        .set("Content-Type", "application/x-www-form-urlencoded")
        .send("text=test");

      // Should process the request successfully with mocked prisma
      expect(response.status).toBe(201);
    });
  });

  describe("404 handling", () => {
    it("should return 404 for unknown routes", async () => {
      const mockPrisma = createMockPrisma();
      const app = createApp(mockPrisma);

      const response = await request(app).get("/unknown-route");

      expect(response.status).toBe(404);
    });
  });
});
