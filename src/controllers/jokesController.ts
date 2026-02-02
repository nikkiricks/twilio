import type { Request, Response } from "express";
import type { PrismaClient } from "../generated/prisma/client.js";
import { handlePrismaError } from "../utils/prismaErrors.js";
import type {
  CreateJokeInput,
  IdParam,
  GetJokesQuery,
} from "../schemas/jokeSchemas.js";

export function createJokesController(prisma: PrismaClient) {
  return {
    async getAll(req: Request, res: Response): Promise<void> {
      try {
        const { page, limit, author, search, sortBy, sortOrder } =
          req.validatedQuery as GetJokesQuery;

        const skip = (page - 1) * limit;

        const where: {
          author?: { contains: string };
          text?: { contains: string };
        } = {};

        if (author) {
          where.author = { contains: author };
        }
        if (search) {
          where.text = { contains: search };
        }

        const [jokes, total] = await Promise.all([
          prisma.joke.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
          }),
          prisma.joke.count({ where }),
        ]);

        res.json({
          data: jokes,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        handlePrismaError(error, res);
      }
    },

    async getById(req: Request, res: Response): Promise<Response | void> {
      try {
        const { id } = req.validatedParams as IdParam;

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
      try {
        const { text, author } = req.validatedBody as CreateJokeInput;

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
