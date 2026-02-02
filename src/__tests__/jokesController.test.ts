import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response } from "express";
import { createJokesController } from "../controllers/jokesController.js";
import { createMockPrisma, createMockJoke } from "./helpers.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import { Prisma } from "../generated/prisma/client.js";

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    params: {},
    body: {},
    ...overrides,
  } as Request;
}

function createMockResponse(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe("JokesController", () => {
  let mockPrisma: PrismaClient;
  let controller: ReturnType<typeof createJokesController>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    controller = createJokesController(mockPrisma);
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("getAll", () => {
    it("should return all jokes ordered by id descending", async () => {
      const mockJokes = [
        createMockJoke({ id: 2, text: "Second joke" }),
        createMockJoke({ id: 1, text: "First joke" }),
      ];
      vi.mocked(mockPrisma.joke.findMany).mockResolvedValue(mockJokes);

      const req = createMockRequest();
      const res = createMockResponse();

      await controller.getAll(req, res);

      expect(mockPrisma.joke.findMany).toHaveBeenCalledWith({
        orderBy: { id: "desc" },
      });
      expect(res.json).toHaveBeenCalledWith(mockJokes);
    });

    it("should return empty array when no jokes exist", async () => {
      vi.mocked(mockPrisma.joke.findMany).mockResolvedValue([]);

      const req = createMockRequest();
      const res = createMockResponse();

      await controller.getAll(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should handle database errors", async () => {
      const dbError = new Prisma.PrismaClientKnownRequestError("Connection failed", {
        code: "P2024",
        clientVersion: "5.0.0",
      });
      vi.mocked(mockPrisma.joke.findMany).mockRejectedValue(dbError);

      const req = createMockRequest();
      const res = createMockResponse();

      await controller.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Database request error",
        code: "P2024",
        message: "Connection failed",
      });
    });
  });

  describe("getById", () => {
    it("should return a joke by id", async () => {
      const mockJoke = createMockJoke({ id: 1 });
      vi.mocked(mockPrisma.joke.findUnique).mockResolvedValue(mockJoke);

      const req = createMockRequest({ params: { id: "1" } });
      const res = createMockResponse();

      await controller.getById(req, res);

      expect(mockPrisma.joke.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(res.json).toHaveBeenCalledWith(mockJoke);
    });

    it("should return 404 when joke is not found", async () => {
      vi.mocked(mockPrisma.joke.findUnique).mockResolvedValue(null);

      const req = createMockRequest({ params: { id: "999" } });
      const res = createMockResponse();

      await controller.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Joke not found" });
    });

    it("should return 400 when id is not a valid integer", async () => {
      const req = createMockRequest({ params: { id: "abc" } });
      const res = createMockResponse();

      await controller.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "id must be an integer" });
      expect(mockPrisma.joke.findUnique).not.toHaveBeenCalled();
    });

    it("should return 400 when id is a float", async () => {
      const req = createMockRequest({ params: { id: "1.5" } });
      const res = createMockResponse();

      await controller.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "id must be an integer" });
      expect(mockPrisma.joke.findUnique).not.toHaveBeenCalled();
    });

    it("should handle zero as a valid id", async () => {
      vi.mocked(mockPrisma.joke.findUnique).mockResolvedValue(null);

      const req = createMockRequest({ params: { id: "0" } });
      const res = createMockResponse();

      await controller.getById(req, res);

      expect(mockPrisma.joke.findUnique).toHaveBeenCalledWith({
        where: { id: 0 },
      });
    });

    it("should handle negative integer ids", async () => {
      vi.mocked(mockPrisma.joke.findUnique).mockResolvedValue(null);

      const req = createMockRequest({ params: { id: "-1" } });
      const res = createMockResponse();

      await controller.getById(req, res);

      expect(mockPrisma.joke.findUnique).toHaveBeenCalledWith({
        where: { id: -1 },
      });
    });

    it("should handle database errors", async () => {
      const dbError = new Prisma.PrismaClientKnownRequestError("Record not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      vi.mocked(mockPrisma.joke.findUnique).mockRejectedValue(dbError);

      const req = createMockRequest({ params: { id: "1" } });
      const res = createMockResponse();

      await controller.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Record not found",
        code: "P2025",
      });
    });
  });

  describe("create", () => {
    it("should create a joke with text only", async () => {
      const newJoke = createMockJoke({ text: "New joke", author: null });
      vi.mocked(mockPrisma.joke.create).mockResolvedValue(newJoke);

      const req = createMockRequest({ body: { text: "New joke" } });
      const res = createMockResponse();

      await controller.create(req, res);

      expect(mockPrisma.joke.create).toHaveBeenCalledWith({
        data: { text: "New joke", author: undefined },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newJoke);
    });

    it("should create a joke with text and author", async () => {
      const newJoke = createMockJoke({ text: "New joke", author: "John Doe" });
      vi.mocked(mockPrisma.joke.create).mockResolvedValue(newJoke);

      const req = createMockRequest({ body: { text: "New joke", author: "John Doe" } });
      const res = createMockResponse();

      await controller.create(req, res);

      expect(mockPrisma.joke.create).toHaveBeenCalledWith({
        data: { text: "New joke", author: "John Doe" },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newJoke);
    });

    it("should return 400 when text is missing", async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing required field: text" });
      expect(mockPrisma.joke.create).not.toHaveBeenCalled();
    });

    it("should return 400 when text is empty string", async () => {
      const req = createMockRequest({ body: { text: "" } });
      const res = createMockResponse();

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing required field: text" });
      expect(mockPrisma.joke.create).not.toHaveBeenCalled();
    });

    it("should return 400 when text is not a string", async () => {
      const req = createMockRequest({ body: { text: 123 } });
      const res = createMockResponse();

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing required field: text" });
      expect(mockPrisma.joke.create).not.toHaveBeenCalled();
    });

    it("should return 400 when text is null", async () => {
      const req = createMockRequest({ body: { text: null } });
      const res = createMockResponse();

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing required field: text" });
      expect(mockPrisma.joke.create).not.toHaveBeenCalled();
    });

    it("should return 400 when text is an array", async () => {
      const req = createMockRequest({ body: { text: ["joke1", "joke2"] } });
      const res = createMockResponse();

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing required field: text" });
      expect(mockPrisma.joke.create).not.toHaveBeenCalled();
    });

    it("should handle unique constraint violation", async () => {
      const dbError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.0.0",
        meta: { target: ["text"] },
      });
      vi.mocked(mockPrisma.joke.create).mockRejectedValue(dbError);

      const req = createMockRequest({ body: { text: "Duplicate joke" } });
      const res = createMockResponse();

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "A record with this value already exists",
        code: "P2002",
        field: ["text"],
      });
    });

    it("should handle validation errors", async () => {
      const dbError = new Prisma.PrismaClientValidationError("Invalid data", {
        clientVersion: "5.0.0",
      });
      vi.mocked(mockPrisma.joke.create).mockRejectedValue(dbError);

      const req = createMockRequest({ body: { text: "Test joke" } });
      const res = createMockResponse();

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid data provided",
        message: dbError.message,
      });
    });

    it("should handle unexpected errors", async () => {
      vi.mocked(mockPrisma.joke.create).mockRejectedValue(new Error("Unexpected"));

      const req = createMockRequest({ body: { text: "Test joke" } });
      const res = createMockResponse();

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });
});
