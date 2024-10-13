import express from 'express'
import { MongoClient } from 'mongodb'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { resolve } from 'path'
import dotenv from 'dotenv'
import axios from 'axios'

import { Html } from './html.js'

dotenv.config()
const server = express()
const PORT = 8080
const __dirname = process.cwd()
const mongoKey = process.env.REACT_APP_MONGODB_PASS

const url = `mongodb+srv://chistiakovmax:${mongoKey}@purecluster.ecsgkq4.mongodb.net/puredb?retryWrites=true&w=majority`;  
const client = new MongoClient(url, { useNewUrlParser:true, useUnifiedTopology: true });  

const middleware = [
  cors(),
  cookieParser(),
  express.json({ limit: '50kb' }),
  express.static(resolve(__dirname, 'dist'))
]

middleware.forEach((it) => server.use(it))

server.get('/', (req, res) => {
  res.send('Express Server')
})

server.get('/products', async (req, res) => {
  try {
      await client.connect();
      
      const db = client.db("puredb");
      const collection = db.collection("items");
      const cursor = collection.find({}).sort({ item: 1 });

      const data = [];
      try {
          while (await cursor.hasNext()) {
              data.push(await cursor.next());
          }
      } catch (err) {
          console.error('Error fetching data from cursor', err);
          throw err;
      }

      res.json(data);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
  } finally {
      try {
          await client.close();
      } catch (err) {
          console.error('Error closing database connection', err);
      }
  }
});


server.get('/horoscope', async (req, res) => {
  const sign = req.query.sign;
  const date = req.query.date;
  
  if (!sign) {
    return res.status(400).json({ error: 'Знак зодиака (sign) обязателен' });
  }

  if (!date) {
    date = "TODAY"
  }
  
  try {
  const apiResponse = await axios.get(`https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=${sign}&day=${date}`);
  const result = apiResponse.data.data.horoscope_data
  res.json(result);
  } catch (error) {
  console.error(error);
  res.status(500).json({ error: 'Не удалось получить гороскоп' });
  }
});

server.get('/*', (req, res) => {
  const initialState = {
    location: req.url
  }

  res.send(
    Html({
      body: '',
      initialState
    })
  )
})

server.listen(PORT, () => {
  console.log(`Serving at http://localhost:${PORT}`)
})

