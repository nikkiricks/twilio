export interface Joke {
  id: number;
  text: string;
  author: string | null;
  createdAt: Date;
}

export interface CreateJokeInput {
  text: string;
  author?: string;
}

export interface ApiError {
  error: string;
}
