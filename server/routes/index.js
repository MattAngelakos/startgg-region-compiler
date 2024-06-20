import express from "express";

import baseRouter from "./base.js"
import usersRouter from "./users.js";
import regionRouter from "./regions.js";
import playerRouter from "./players.js";
import tournamentRouter from "./tournaments.js";

const router = express.Router();

router.get("/", (req, res) => {
    res.status(200).send("This is a server dude! 🙏");
});

const setupRoutes = (app) => {
    app.use("/", router);
    app.use("/user", usersRouter);
    app.use("/region", regionRouter);
    app.use("/player", playerRouter);
    app.use("/player", tournamentRouter);
    app.use("*", (req, res) => {
        res.status(404).json({ error: "Not found" });
    });
};

export default setupRoutes;