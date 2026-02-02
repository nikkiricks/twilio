import { vi } from "vitest";
import type { PrismaClient } from "../generated/prisma/client.js";

export interface MockJoke {
  id: number;
  text: string;
  author: string | null;
  createdAt: Date;
}

export interface MockJokeJson {
  id: number;
  text: string;
  author: string | null;
  createdAt: string;
}

export function createMockPrisma() {
  return {
    joke: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  } as unknown as PrismaClient;
}

export function createMockJoke(overrides: Partial<MockJoke> = {}): MockJoke {
  return {
    id: 1,
    text: "Why did the developer go broke? Because they used up all their cache.",
    author: "Anonymous",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

export function toJsonFormat(joke: MockJoke): MockJokeJson {
  return {
    ...joke,
    createdAt: joke.createdAt.toISOString(),
  };
}
