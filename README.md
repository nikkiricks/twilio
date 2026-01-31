# Jokes API

A RESTful API for managing a collection of jokes, built with Node.js, Express, TypeScript, and Prisma.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js v5
- **ORM:** Prisma with SQLite (LibSQL)
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

| Method | Endpoint     | Description          |
|--------|--------------|----------------------|
| GET    | `/`          | Health check         |
| GET    | `/jokes`     | Get all jokes        |
| GET    | `/jokes/:id` | Get a joke by ID     |
| POST   | `/jokes`     | Create a new joke    |

### Example Requests

**Get all jokes:**
```bash
curl http://localhost:4000/jokes
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

## Project Structure

```
├── index.ts              # Express server entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── src/
│   ├── types/            # TypeScript interfaces
│   ├── routes/           # API route handlers
│   ├── controller/       # Controller layer (extensible)
│   └── model/            # Model layer (extensible)
└── dev.db                # SQLite database
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

## Environment

The project uses a `.env` file for configuration:

```
DATABASE_URL="file:./dev.db"
```

## Design Decisions

- **SQLite + Prisma:** Chosen for zero-config local development and type-safe database queries
- **Express v5:** Latest version with improved async error handling
- **MVC-inspired structure:** Separation of concerns with room for growth
- **TypeScript strict mode:** Catches errors at compile time

## Potential Extensions

This foundation could be extended with:
- Twilio SMS notifications for new jokes
- Voice API to read jokes aloud
- WhatsApp bot integration
- User authentication
