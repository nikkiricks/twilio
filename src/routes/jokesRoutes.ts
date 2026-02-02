import type { Express } from "express";
import type { PrismaClient } from "../generated/prisma/client.js";
import { createJokesController } from "../controllers/jokesController.js";
import { validate } from "../middleware/validate.js";
import {
  idParamSchema,
  createJokeSchema,
  getJokesQuerySchema,
} from "../schemas/jokeSchemas.js";

export function createJokesRoutes(app: Express, prisma: PrismaClient): void {
  const controller = createJokesController(prisma);

  app.get(
    "/jokes",
    validate({ query: getJokesQuerySchema }),
    controller.getAll
  );

  app.get(
    "/jokes/:id",
    validate({ params: idParamSchema }),
    controller.getById
  );

  app.post(
    "/jokes",
    validate({ body: createJokeSchema }),
    controller.create
  );
}
