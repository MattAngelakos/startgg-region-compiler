import baseRouter from "./base.js"
import usersRouter from "./users.js";
import regionRouter from "./regions.js";
import playerRouter from "./players.js";
import tournamentRouter from "./tournaments.js";

const setupRoutes = (app) => {
    app.use("/", baseRouter);
    app.use("/users", usersRouter);
    app.use("/regions", regionRouter);
    app.use("/players", playerRouter);
    app.use("/tournaments", tournamentRouter);
    app.use("*", (req, res) => {
        res.status(404).json({ error: "Not found" });
    });
};

export default setupRoutes;