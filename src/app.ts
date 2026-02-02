import express, { type Request, type Response } from "express";
import { createJokesRoutes } from "./routes/jokesRoutes.js";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";

export function createApp(prismaClient?: PrismaClient) {
  const app = express();

  // Use provided prisma client or create default one
  const prisma =
    prismaClient ??
    new PrismaClient({
      adapter: new PrismaLibSql({ url: "file:dev.db" }),
    });

  // middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // routes
  createJokesRoutes(app, prisma);

  // root route
  app.get("/", (_req: Request, res: Response) => {
    res.send("Hi Twilio! Node and express server running");
  });

  return app;
}
