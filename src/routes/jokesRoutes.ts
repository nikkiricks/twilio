import type { Express } from "express";
import type { PrismaClient } from "../generated/prisma/client.js";
import { createJokesController } from "../controllers/jokesController.js";

export function createJokesRoutes(app: Express, prisma: PrismaClient): void {
  const controller = createJokesController(prisma);

  app.get("/jokes", controller.getAll);
  app.get("/jokes/:id", controller.getById);
  app.post("/jokes", controller.create);
}
