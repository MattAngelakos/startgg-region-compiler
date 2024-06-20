import express from "express";
import configRoutes from "./routes/index.js";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
configRoutes(app);
app.listen(4000, async () => {
    console.log("We now have a server! ");
    console.log('Your routes will be running on http://localhost:4000');
});