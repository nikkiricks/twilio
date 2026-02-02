import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express, { type Application } from "express";
import { createJokesRoutes } from "../routes/jokesRoutes.js";
import { createMockPrisma, createMockJoke, toJsonFormat } from "./helpers.js";
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

  describe("Route Registration", () => {
    it("should register GET /jokes route", async () => {
      vi.mocked(mockPrisma.joke.findMany).mockResolvedValue([]);
      vi.mocked(mockPrisma.joke.count).mockResolvedValue(0);

      const response = await request(app).get("/jokes");

      expect(response.status).toBe(200);
    });

    it("should register GET /jokes/:id route", async () => {
      vi.mocked(mockPrisma.joke.findUnique).mockResolvedValue(null);

      const response = await request(app).get("/jokes/1");

      expect(response.status).toBe(404);
    });

    it("should register POST /jokes route", async () => {
      const mockJoke = createMockJoke({ text: "test" });
      vi.mocked(mockPrisma.joke.create).mockResolvedValue(mockJoke);

      const response = await request(app).post("/jokes").send({ text: "test" });

      expect(response.status).toBe(201);
    });
  });

  describe("GET /jokes - Integration", () => {
    it("should return all jokes with pagination", async () => {
      const mockJokes = [
        createMockJoke({ id: 2, text: "Second joke" }),
        createMockJoke({ id: 1, text: "First joke" }),
      ];
      vi.mocked(mockPrisma.joke.findMany).mockResolvedValue(mockJokes);
      vi.mocked(mockPrisma.joke.count).mockResolvedValue(2);

      const response = await request(app).get("/jokes");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: mockJokes.map(toJsonFormat),
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it("should return empty array when no jokes exist", async () => {
      vi.mocked(mockPrisma.joke.findMany).mockResolvedValue([]);
      vi.mocked(mockPrisma.joke.count).mockResolvedValue(0);

      const response = await request(app).get("/jokes");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it("should support pagination query params", async () => {
      vi.mocked(mockPrisma.joke.findMany).mockResolvedValue([]);
      vi.mocked(mockPrisma.joke.count).mockResolvedValue(50);

      const response = await request(app).get("/jokes?page=2&limit=5");

      expect(response.status).toBe(200);
      expect(mockPrisma.joke.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
      expect(response.body.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 50,
        totalPages: 10,
      });
    });

    it("should support author filter", async () => {
      vi.mocked(mockPrisma.joke.findMany).mockResolvedValue([]);
      vi.mocked(mockPrisma.joke.count).mockResolvedValue(0);

      const response = await request(app).get("/jokes?author=John");

      expect(response.status).toBe(200);
      expect(mockPrisma.joke.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { author: { contains: "John" } },
        })
      );
    });

    it("should support search filter", async () => {
      vi.mocked(mockPrisma.joke.findMany).mockResolvedValue([]);
      vi.mocked(mockPrisma.joke.count).mockResolvedValue(0);

      const response = await request(app).get("/jokes?search=funny");

      expect(response.status).toBe(200);
      expect(mockPrisma.joke.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { text: { contains: "funny" } },
        })
      );
    });

    it("should support sorting", async () => {
      vi.mocked(mockPrisma.joke.findMany).mockResolvedValue([]);
      vi.mocked(mockPrisma.joke.count).mockResolvedValue(0);

      const response = await request(app).get("/jokes?sortBy=createdAt&sortOrder=asc");

      expect(response.status).toBe(200);
      expect(mockPrisma.joke.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "asc" },
        })
      );
    });

    it("should return 400 for invalid page param", async () => {
      const response = await request(app).get("/jokes?page=abc");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
    });

    it("should return 400 for invalid limit param", async () => {
      const response = await request(app).get("/jokes?limit=999");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
    });
  });

  describe("POST /jokes - Integration", () => {
    it("should create a joke with text only", async () => {
      const newJoke = createMockJoke({ text: "New joke", author: null });
      vi.mocked(mockPrisma.joke.create).mockResolvedValue(newJoke);

      const response = await request(app)
        .post("/jokes")
        .send({ text: "New joke" });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(toJsonFormat(newJoke));
    });

    it("should create a joke with text and author", async () => {
      const newJoke = createMockJoke({ text: "New joke", author: "John Doe" });
      vi.mocked(mockPrisma.joke.create).mockResolvedValue(newJoke);

      const response = await request(app)
        .post("/jokes")
        .send({ text: "New joke", author: "John Doe" });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(toJsonFormat(newJoke));
    });

    it("should return 400 when text is missing", async () => {
      const response = await request(app).post("/jokes").send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "text" }),
        ])
      );
      expect(mockPrisma.joke.create).not.toHaveBeenCalled();
    });

    it("should return 400 when text is empty string", async () => {
      const response = await request(app).post("/jokes").send({ text: "" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
    });

    it("should return 400 when text is not a string", async () => {
      const response = await request(app).post("/jokes").send({ text: 123 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
    });
  });

  describe("GET /jokes/:id - Integration", () => {
    it("should return a joke by id", async () => {
      const mockJoke = createMockJoke({ id: 1 });
      vi.mocked(mockPrisma.joke.findUnique).mockResolvedValue(mockJoke);

      const response = await request(app).get("/jokes/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(toJsonFormat(mockJoke));
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
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "id" }),
        ])
      );
      expect(mockPrisma.joke.findUnique).not.toHaveBeenCalled();
    });

    it("should return 400 when id is a float", async () => {
      const response = await request(app).get("/jokes/1.5");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
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
  });
});
