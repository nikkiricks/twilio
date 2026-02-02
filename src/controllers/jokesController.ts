import type { Request, Response } from "express";
import type { PrismaClient } from "../generated/prisma/client.js";
import { handlePrismaError } from "../utils/prismaErrors.js";

export function createJokesController(prisma: PrismaClient) {
  return {
    async getAll(_req: Request, res: Response): Promise<void> {
      try {
        const jokes = await prisma.joke.findMany({
          orderBy: { id: "desc" },
        });
        res.json(jokes);
      } catch (error) {
        handlePrismaError(error, res);
      }
    },

    async getById(req: Request, res: Response): Promise<Response | void> {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "id must be an integer" });
      }

      try {
        const joke = await prisma.joke.findUnique({ where: { id } });

        if (!joke) {
          return res.status(404).json({ error: "Joke not found" });
        }

        return res.json(joke);
      } catch (error) {
        return handlePrismaError(error, res);
      }
    },

    async create(req: Request, res: Response): Promise<Response | void> {
      const { text, author } = req.body as { text?: string; author?: string };

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Missing required field: text" });
      }

      try {
        const joke = await prisma.joke.create({
          data: { text, author },
        });
        return res.status(201).json(joke);
      } catch (error) {
        return handlePrismaError(error, res);
      }
    },
  };
}

export type JokesController = ReturnType<typeof createJokesController>;
