# Jokes API

A RESTful API for managing a collection of jokes, built with Node.js, Express, TypeScript, and Prisma.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js v5
- **ORM:** Prisma with SQLite (LibSQL)
- **Validation:** Zod
- **Testing:** Vitest + Supertest
- **Dev Tools:** tsx (hot-reload), dotenv

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm start
```

The server runs at `http://localhost:4000`

## API Endpoints

| Method | Endpoint     | Description                      |
|--------|--------------|----------------------------------|
| GET    | `/`          | Health check                     |
| GET    | `/jokes`     | Get all jokes (with pagination)  |
| GET    | `/jokes/:id` | Get a joke by ID                 |
| POST   | `/jokes`     | Create a new joke                |

### Query Parameters (GET /jokes)

| Parameter   | Type   | Default | Description                           |
|-------------|--------|---------|---------------------------------------|
| `page`      | number | 1       | Page number (must be ≥ 1)             |
| `limit`     | number | 10      | Items per page (1-100)                |
| `author`    | string | -       | Filter by author (partial match)      |
| `search`    | string | -       | Search in joke text (partial match)   |
| `sortBy`    | string | "id"    | Sort field: "id", "createdAt", "text" |
| `sortOrder` | string | "desc"  | Sort direction: "asc" or "desc"       |

### Example Requests

**Get all jokes with pagination:**
```bash
curl "http://localhost:4000/jokes?page=1&limit=5"
```

**Filter by author:**
```bash
curl "http://localhost:4000/jokes?author=Anonymous"
```

**Search jokes:**
```bash
curl "http://localhost:4000/jokes?search=programmer"
```

**Pagination with sorting:**
```bash
curl "http://localhost:4000/jokes?page=2&limit=10&sortBy=createdAt&sortOrder=asc"
```

**Create a joke:**
```bash
curl -X POST http://localhost:4000/jokes \
  -H "Content-Type: application/json" \
  -d '{"text": "Why do programmers prefer dark mode? Because light attracts bugs.", "author": "Anonymous"}'
```

**Get a specific joke:**
```bash
curl http://localhost:4000/jokes/1
```

### Response Format

**GET /jokes (paginated):**
```json
{
  "data": [
    {
      "id": 1,
      "text": "Why did the developer go broke?",
      "author": "Anonymous",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Validation Error:**
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "text", "message": "text cannot be empty" }
  ]
}
```

## Testing

```bash
# Run tests
npm test

# Run tests once (no watch)
npm run test:run

# Run tests with coverage
npm run test:coverage
```

**Current Coverage:** 100% statements, 100% functions, 100% lines

## Project Structure

```
├── index.ts                    # Express server entry point
├── prisma/
│   └── schema.prisma           # Database schema
├── src/
│   ├── app.ts                  # Express app factory
│   ├── controllers/
│   │   └── jokesController.ts  # Request handlers
│   ├── middleware/
│   │   └── validate.ts         # Zod validation middleware
│   ├── routes/
│   │   └── jokesRoutes.ts      # Route definitions
│   ├── schemas/
│   │   └── jokeSchemas.ts      # Zod validation schemas
│   ├── utils/
│   │   └── prismaErrors.ts     # Prisma error handling
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── generated/
│   │   └── prisma/             # Generated Prisma client
│   └── __tests__/
│       ├── app.test.ts
│       ├── jokesController.test.ts
│       ├── jokesRoutes.test.ts
│       ├── prismaErrors.test.ts
│       ├── validate.test.ts
│       ├── types.test.ts
│       └── helpers.ts
├── dev.db                      # SQLite database
└── vitest.config.ts            # Test configuration
```

## Data Model

```prisma
model Joke {
  id        Int      @id @default(autoincrement())
  text      String
  author    String?
  createdAt DateTime @default(now())
}
```

## Validation

Request validation is handled by Zod schemas:

**Body (POST /jokes):**
- `text` - required, non-empty string
- `author` - optional string

**Params (GET /jokes/:id):**
- `id` - must be a valid integer

**Query (GET /jokes):**
- All parameters are optional with sensible defaults
- Invalid values return 400 with detailed error messages

## Error Handling

The API uses Prisma's error types for robust database error handling:

| Prisma Code | HTTP Status | Description                  |
|-------------|-------------|------------------------------|
| P2002       | 409         | Unique constraint violation  |
| P2025       | 404         | Record not found             |
| P2003       | 400         | Foreign key constraint       |
| P2014       | 400         | Required relation violation  |
| -           | 503         | Database connection error    |
| -           | 500         | Internal server error        |

## Environment

The project uses a `.env` file for configuration:

```
DATABASE_URL="file:./dev.db"
```

## Design Decisions

- **SQLite + Prisma:** Zero-config local development with type-safe queries
- **Express v5:** Improved async error handling
- **Zod validation:** Type-safe request validation with automatic TypeScript inference
- **Separation of concerns:** Controllers, middleware, routes, and utilities are clearly separated
- **Comprehensive testing:** Unit and integration tests with 100% coverage

## Potential Extensions

This foundation could be extended with:
- Twilio SMS notifications for new jokes
- Voice API to read jokes aloud
- WhatsApp bot integration
- User authentication
- Rate limiting
- Caching layer
