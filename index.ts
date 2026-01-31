import express, { Application, Request, Response } from 'express';
import routes from './src/routes/jokesRoutes.js';

const app: Application = express();
const PORT = 4000;

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
routes(app);

// root route
app.get('/', (req: Request, res: Response) => {
  res.send(`Hi Twilio! 👋 Node and express server running on port ${PORT}`);
});

// server
app.listen(PORT, () => {
  console.log(`Your server is running on port ${PORT}`);
});
