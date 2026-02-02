import type { Response } from "express";
import { Prisma } from "../generated/prisma/client.js";

interface PrismaErrorResponse {
  error: string;
  code?: string;
  field?: unknown;
  message?: string;
}

const ERROR_MESSAGES: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: "A record with this value already exists" },
  P2025: { status: 404, message: "Record not found" },
  P2003: { status: 400, message: "Related record not found" },
  P2014: { status: 400, message: "Required relation violation" },
};

export function handlePrismaError(error: unknown, res: Response): Response {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const errorConfig = ERROR_MESSAGES[error.code];

    if (errorConfig) {
      const response: PrismaErrorResponse = {
        error: errorConfig.message,
        code: error.code,
      };

      if (error.code === "P2002") {
        response.field = error.meta?.target;
      }

      return res.status(errorConfig.status).json(response);
    }

    return res.status(400).json({
      error: "Database request error",
      code: error.code,
      message: error.message,
    });
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      error: "Invalid data provided",
      message: error.message,
    });
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("Database connection error:", error);
    return res.status(503).json({
      error: "Database connection error",
    });
  }

  console.error("Unexpected error:", error);
  return res.status(500).json({
    error: "Internal server error",
  });
}
