import { vi } from "vitest";

// Global test setup
vi.mock("@prisma/adapter-libsql", () => ({
  PrismaLibSql: vi.fn().mockImplementation(() => ({})),
}));
