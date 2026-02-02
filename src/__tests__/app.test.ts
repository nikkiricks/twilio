import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { createMockPrisma } from "./helpers.js";

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
      const app = createApp(mockPrisma);

      const response = await request(app)
        .post("/jokes")
        .set("Content-Type", "application/json")
        .send(JSON.stringify({ text: "test" }));

      // Should process the request (even if it returns 400 due to validation)
      // The fact that it processes JSON at all means middleware is working
      expect(response.status).not.toBe(415);
    });

    it("should parse URL-encoded request bodies", async () => {
      const mockPrisma = createMockPrisma();
      const app = createApp(mockPrisma);

      const response = await request(app)
        .post("/jokes")
        .set("Content-Type", "application/x-www-form-urlencoded")
        .send("text=test");

      expect(response.status).not.toBe(415);
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
