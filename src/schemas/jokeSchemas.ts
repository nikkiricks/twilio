import { z } from "zod";

// Param schemas
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "id must be a valid integer").transform(Number),
});

// Body schemas
export const createJokeSchema = z.object({
  text: z
    .string({ message: "text is required" })
    .min(1, "text cannot be empty"),
  author: z.string().optional(),
});

// Query schemas for filtering and pagination
export const getJokesQuerySchema = z
  .object({
    // Pagination
    page: z
      .string()
      .regex(/^\d+$/, "page must be a positive integer")
      .transform(Number)
      .refine((n) => n >= 1, "page must be at least 1")
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, "limit must be a positive integer")
      .transform(Number)
      .refine((n) => n >= 1 && n <= 100, "limit must be between 1 and 100")
      .optional(),
    // Filtering
    author: z.string().optional(),
    search: z.string().optional(),
    // Sorting
    sortBy: z.enum(["id", "createdAt", "text"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  })
  .transform((data) => ({
    page: data.page ?? 1,
    limit: data.limit ?? 10,
    author: data.author,
    search: data.search,
    sortBy: data.sortBy ?? ("id" as const),
    sortOrder: data.sortOrder ?? ("desc" as const),
  }));

// Type exports
export type IdParam = z.infer<typeof idParamSchema>;
export type CreateJokeInput = z.infer<typeof createJokeSchema>;
export type GetJokesQuery = z.infer<typeof getJokesQuerySchema>;
