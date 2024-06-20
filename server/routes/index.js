import express from "express";

import baseRouter from "./base.js"
import usersRouter from "./users.js";
import regionRouter from "./regions.js";
import playerRouter from "./players.js";
import tournamentRouter from "./tournaments.js";

const setupRoutes = (app) => {
    app.use("/", baseRouter);
    app.use("/user", usersRouter);
    app.use("/region", regionRouter);
    app.use("/player", playerRouter);
    app.use("/tournament", tournamentRouter);
    app.use("*", (req, res) => {
        res.status(404).json({ error: "Not found" });
    });
};

export default setupRoutes;