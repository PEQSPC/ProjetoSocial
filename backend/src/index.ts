import { Request, Response } from "express";
import express from "express";

const app = express();
const port = 3000;

app.get("/", (_: Request, res: Response) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  //const testTscErrors : string = 42; // Intentional type error for testing
  console.log(`Example app listening at http://localhost:${port}`);
});
