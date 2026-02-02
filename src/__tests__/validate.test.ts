import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    params: {},
    body: {},
    query: {},
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

describe("validate middleware", () => {
  describe("body validation", () => {
    const bodySchema = z.object({
      name: z.string().min(1),
      age: z.number().optional(),
    });

    it("should pass valid body and set validatedBody", async () => {
      const req = createMockRequest({ body: { name: "John", age: 30 } });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = validate({ body: bodySchema });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validatedBody).toEqual({ name: "John", age: 30 });
    });

    it("should return 400 for invalid body", async () => {
      const req = createMockRequest({ body: { name: "" } });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = validate({ body: bodySchema });
      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Validation failed",
        details: expect.arrayContaining([
          expect.objectContaining({ field: "name" }),
        ]),
      });
    });

    it("should return 400 for missing required fields", async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = validate({ body: bodySchema });
      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("params validation", () => {
    const paramsSchema = z.object({
      id: z.string().regex(/^\d+$/).transform(Number),
    });

    it("should pass valid params and set validatedParams", async () => {
      const req = createMockRequest({ params: { id: "123" } });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = validate({ params: paramsSchema });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validatedParams).toEqual({ id: 123 });
    });

    it("should return 400 for invalid params", async () => {
      const req = createMockRequest({ params: { id: "abc" } });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = validate({ params: paramsSchema });
      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Validation failed",
        details: expect.arrayContaining([
          expect.objectContaining({ field: "id" }),
        ]),
      });
    });
  });

  describe("query validation", () => {
    const querySchema = z
      .object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
      })
      .transform((data) => ({
        page: data.page ?? 1,
        limit: data.limit ?? 10,
      }));

    it("should pass valid query and set validatedQuery", async () => {
      const req = createMockRequest({ query: { page: "2", limit: "20" } });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = validate({ query: querySchema });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validatedQuery).toEqual({ page: 2, limit: 20 });
    });

    it("should apply defaults for missing query params", async () => {
      const req = createMockRequest({ query: {} });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = validate({ query: querySchema });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validatedQuery).toEqual({ page: 1, limit: 10 });
    });

    it("should return 400 for invalid query params", async () => {
      const req = createMockRequest({ query: { page: "abc" } });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = validate({ query: querySchema });
      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("combined validation", () => {
    it("should validate body, params, and query together", async () => {
      const schemas = {
        body: z.object({ text: z.string() }),
        params: z.object({ id: z.string() }),
        query: z.object({ format: z.string().optional() }),
      };

      const req = createMockRequest({
        body: { text: "hello" },
        params: { id: "123" },
        query: { format: "json" },
      });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = validate(schemas);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validatedBody).toEqual({ text: "hello" });
      expect(req.validatedParams).toEqual({ id: "123" });
      expect(req.validatedQuery).toEqual({ format: "json" });
    });

    it("should collect errors from all sources", async () => {
      const schemas = {
        body: z.object({ text: z.string().min(1) }),
        params: z.object({ id: z.string().regex(/^\d+$/) }),
      };

      const req = createMockRequest({
        body: { text: "" },
        params: { id: "abc" },
      });
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = validate(schemas);
      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Validation failed",
        details: expect.arrayContaining([
          expect.objectContaining({ field: "id" }),
          expect.objectContaining({ field: "text" }),
        ]),
      });
    });
  });

  describe("no schemas", () => {
    it("should call next when no schemas provided", async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = vi.fn();

      const middleware = validate({});
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
