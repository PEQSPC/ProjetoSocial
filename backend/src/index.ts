import { Request, Response } from 'express';
import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req : Request, res : Response) => {
  req.body; // Using req.body to avoid unused parameter warning
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});



