import type { Express, Request, Response } from "express";
import type { PrismaClient } from "../generated/prisma/client.js";

export function createJokesRoutes(app: Express, prisma: PrismaClient): void {
  // GET all jokes
  app.get("/jokes", async (_req: Request, res: Response) => {
    const jokes = await prisma.joke.findMany({
      orderBy: { id: "desc" },
    });
    res.json(jokes);
  });

  // POST create a joke
  app.post("/jokes", async (req: Request, res: Response) => {
    const { text, author } = req.body as { text?: string; author?: string };

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing required field: text" });
    }

    const joke = await prisma.joke.create({
      data: { text, author },
    });

    return res.status(201).json(joke);
  });

  // GET one joke by id
  app.get("/jokes/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "id must be an integer" });
    }

    const joke = await prisma.joke.findUnique({ where: { id } });

    if (!joke) {
      return res.status(404).json({ error: "Joke not found" });
    }

    return res.json(joke);
  });
}
