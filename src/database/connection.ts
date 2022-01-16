import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configuring dotenv to read the variable from .env file
dotenv.config();

/* 
  Create the connection to the database
  of mongodb.
*/

export const createConnectionMongo = (password: string | undefined) => {
  mongoose.connect(
    `mongodb+srv://relsew:${password}@cluster0.m0j11.mongodb.net/anime-directory?retryWrites=true&w=majority`,
  );

  mongoose.connection.on('error', err => {
    console.log('err', err);
  });
  mongoose.connection.on('connected', (err, res) => {
    console.log('Database connected: mongoose.');
  });
};
