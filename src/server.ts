import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler, notFound } from './middlewares/middleware';
import { createConnectionMongo } from './database/connection';
import routes from './routes';

const app: Application = express();

dotenv.config();
createConnectionMongo(process.env.DB_PASSWORD);
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(routes);
app.use(notFound);
app.use(errorHandler);

/*
  Starting the server on the .env process
  you can define the PORT where the server
  is going to listen in the server.
  ex: PORT=5000.
*/
const server = app.listen(process.env.PORT_LISTEN || 5000);

function shutdown(): void {
  server.close();
  process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGQUIT', shutdown);
process.on('SIGTERM', shutdown);
