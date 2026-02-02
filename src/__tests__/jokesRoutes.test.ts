import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express, { Application } from "express";
import { createJokesRoutes } from "../routes/jokesRoutes.js";
import { createMockPrisma, createMockJoke } from "./helpers.js";
import type { PrismaClient } from "../generated/prisma/client.js";

describe("Jokes Routes", () => {
  let app: Application;
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    mockPrisma = createMockPrisma();
    createJokesRoutes(app, mockPrisma);
    vi.clearAllMocks();
  });

  describe("GET /jokes", () => {
    it("should return all jokes ordered by id descending", async () => {
      const mockJokes = [
        createMockJoke({ id: 2, text: "Second joke" }),
        createMockJoke({ id: 1, text: "First joke" }),
      ];
      vi.mocked(mockPrisma.joke.findMany).mockResolvedValue(mockJokes);

      const response = await request(app).get("/jokes");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockJokes);
      expect(mockPrisma.joke.findMany).toHaveBeenCalledWith({
        orderBy: { id: "desc" },
      });
    });

    it("should return empty array when no jokes exist", async () => {
      vi.mocked(mockPrisma.joke.findMany).mockResolvedValue([]);

      const response = await request(app).get("/jokes");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("POST /jokes", () => {
    it("should create a joke with text only", async () => {
      const newJoke = createMockJoke({ text: "New joke", author: null });
      vi.mocked(mockPrisma.joke.create).mockResolvedValue(newJoke);

      const response = await request(app)
        .post("/jokes")
        .send({ text: "New joke" });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(newJoke);
      expect(mockPrisma.joke.create).toHaveBeenCalledWith({
        data: { text: "New joke", author: undefined },
      });
    });

    it("should create a joke with text and author", async () => {
      const newJoke = createMockJoke({ text: "New joke", author: "John Doe" });
      vi.mocked(mockPrisma.joke.create).mockResolvedValue(newJoke);

      const response = await request(app)
        .post("/jokes")
        .send({ text: "New joke", author: "John Doe" });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(newJoke);
      expect(mockPrisma.joke.create).toHaveBeenCalledWith({
        data: { text: "New joke", author: "John Doe" },
      });
    });

    it("should return 400 when text is missing", async () => {
      const response = await request(app).post("/jokes").send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Missing required field: text" });
      expect(mockPrisma.joke.create).not.toHaveBeenCalled();
    });

    it("should return 400 when text is empty string", async () => {
      const response = await request(app).post("/jokes").send({ text: "" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Missing required field: text" });
      expect(mockPrisma.joke.create).not.toHaveBeenCalled();
    });

    it("should return 400 when text is not a string", async () => {
      const response = await request(app).post("/jokes").send({ text: 123 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Missing required field: text" });
      expect(mockPrisma.joke.create).not.toHaveBeenCalled();
    });

    it("should return 400 when text is null", async () => {
      const response = await request(app).post("/jokes").send({ text: null });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Missing required field: text" });
      expect(mockPrisma.joke.create).not.toHaveBeenCalled();
    });

    it("should return 400 when text is an array", async () => {
      const response = await request(app)
        .post("/jokes")
        .send({ text: ["joke1", "joke2"] });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Missing required field: text" });
      expect(mockPrisma.joke.create).not.toHaveBeenCalled();
    });

    it("should ignore extra fields in request body", async () => {
      const newJoke = createMockJoke({ text: "New joke", author: "Author" });
      vi.mocked(mockPrisma.joke.create).mockResolvedValue(newJoke);

      const response = await request(app)
        .post("/jokes")
        .send({ text: "New joke", author: "Author", extraField: "ignored" });

      expect(response.status).toBe(201);
      expect(mockPrisma.joke.create).toHaveBeenCalledWith({
        data: { text: "New joke", author: "Author" },
      });
    });
  });

  describe("GET /jokes/:id", () => {
    it("should return a joke by id", async () => {
      const mockJoke = createMockJoke({ id: 1 });
      vi.mocked(mockPrisma.joke.findUnique).mockResolvedValue(mockJoke);

      const response = await request(app).get("/jokes/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockJoke);
      expect(mockPrisma.joke.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should return 404 when joke is not found", async () => {
      vi.mocked(mockPrisma.joke.findUnique).mockResolvedValue(null);

      const response = await request(app).get("/jokes/999");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Joke not found" });
    });

    it("should return 400 when id is not a valid integer", async () => {
      const response = await request(app).get("/jokes/abc");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "id must be an integer" });
      expect(mockPrisma.joke.findUnique).not.toHaveBeenCalled();
    });

    it("should return 400 when id is a float", async () => {
      const response = await request(app).get("/jokes/1.5");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "id must be an integer" });
      expect(mockPrisma.joke.findUnique).not.toHaveBeenCalled();
    });

    it("should handle large valid integer ids", async () => {
      const mockJoke = createMockJoke({ id: 999999 });
      vi.mocked(mockPrisma.joke.findUnique).mockResolvedValue(mockJoke);

      const response = await request(app).get("/jokes/999999");

      expect(response.status).toBe(200);
      expect(mockPrisma.joke.findUnique).toHaveBeenCalledWith({
        where: { id: 999999 },
      });
    });

    it("should handle zero as a valid id", async () => {
      vi.mocked(mockPrisma.joke.findUnique).mockResolvedValue(null);

      const response = await request(app).get("/jokes/0");

      expect(response.status).toBe(404);
      expect(mockPrisma.joke.findUnique).toHaveBeenCalledWith({
        where: { id: 0 },
      });
    });

    it("should handle negative integer ids", async () => {
      vi.mocked(mockPrisma.joke.findUnique).mockResolvedValue(null);

      const response = await request(app).get("/jokes/-1");

      expect(response.status).toBe(404);
      expect(mockPrisma.joke.findUnique).toHaveBeenCalledWith({
        where: { id: -1 },
      });
    });
  });
});
