import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { handlePrismaError } from "../utils/prismaErrors.js";

function createMockResponse(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe("handlePrismaError", () => {
  let mockRes: Response;

  beforeEach(() => {
    mockRes = createMockResponse();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("PrismaClientKnownRequestError", () => {
    it("should handle P2002 (unique constraint violation) with field info", () => {
      const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.0.0",
        meta: { target: ["email"] },
      });

      handlePrismaError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "A record with this value already exists",
        code: "P2002",
        field: ["email"],
      });
    });

    it("should handle P2025 (record not found)", () => {
      const error = new Prisma.PrismaClientKnownRequestError("Record not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });

      handlePrismaError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Record not found",
        code: "P2025",
      });
    });

    it("should handle P2003 (foreign key constraint violation)", () => {
      const error = new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", {
        code: "P2003",
        clientVersion: "5.0.0",
      });

      handlePrismaError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Related record not found",
        code: "P2003",
      });
    });

    it("should handle P2014 (required relation violation)", () => {
      const error = new Prisma.PrismaClientKnownRequestError("Required relation violation", {
        code: "P2014",
        clientVersion: "5.0.0",
      });

      handlePrismaError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Required relation violation",
        code: "P2014",
      });
    });

    it("should handle unknown Prisma error codes with generic message", () => {
      const error = new Prisma.PrismaClientKnownRequestError("Some other error", {
        code: "P9999",
        clientVersion: "5.0.0",
      });

      handlePrismaError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Database request error",
        code: "P9999",
        message: "Some other error",
      });
    });
  });

  describe("PrismaClientValidationError", () => {
    it("should handle validation errors", () => {
      const error = new Prisma.PrismaClientValidationError("Invalid field type", {
        clientVersion: "5.0.0",
      });

      handlePrismaError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Invalid data provided",
        message: error.message,
      });
    });
  });

  describe("PrismaClientInitializationError", () => {
    it("should handle database connection errors", () => {
      const error = new Prisma.PrismaClientInitializationError("Connection failed", "5.0.0");

      handlePrismaError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Database connection error",
      });
      expect(console.error).toHaveBeenCalledWith("Database connection error:", error);
    });
  });

  describe("Unknown errors", () => {
    it("should handle generic Error objects", () => {
      const error = new Error("Something went wrong");

      handlePrismaError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
      expect(console.error).toHaveBeenCalledWith("Unexpected error:", error);
    });

    it("should handle string errors", () => {
      handlePrismaError("string error", mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });

    it("should handle null/undefined errors", () => {
      handlePrismaError(null, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });
});
