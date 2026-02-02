import { describe, it, expect } from "vitest";
import type { Joke, CreateJokeInput, ApiError } from "../types/index.js";

describe("Types", () => {
  describe("Joke", () => {
    it("should have correct structure with all fields", () => {
      const joke: Joke = {
        id: 1,
        text: "Why do programmers prefer dark mode?",
        author: "Dev",
        createdAt: new Date(),
      };

      expect(joke.id).toBe(1);
      expect(joke.text).toBe("Why do programmers prefer dark mode?");
      expect(joke.author).toBe("Dev");
      expect(joke.createdAt).toBeInstanceOf(Date);
    });

    it("should allow null author", () => {
      const joke: Joke = {
        id: 1,
        text: "Anonymous joke",
        author: null,
        createdAt: new Date(),
      };

      expect(joke.author).toBeNull();
    });
  });

  describe("CreateJokeInput", () => {
    it("should require text field", () => {
      const input: CreateJokeInput = {
        text: "New joke",
      };

      expect(input.text).toBe("New joke");
      expect(input.author).toBeUndefined();
    });

    it("should allow optional author", () => {
      const input: CreateJokeInput = {
        text: "New joke",
        author: "Author Name",
      };

      expect(input.text).toBe("New joke");
      expect(input.author).toBe("Author Name");
    });
  });

  describe("ApiError", () => {
    it("should have error message", () => {
      const error: ApiError = {
        error: "Something went wrong",
      };

      expect(error.error).toBe("Something went wrong");
    });
  });
});
