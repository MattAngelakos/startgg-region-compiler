import express from "express";
import { getAllGames, getGame, getCharacterIcons } from "../data/games.js";
const router = express.Router();

router.get("/games", async (req, res) => {
    try {
        const games = await getAllGames();
        res.status(200).json({
            games: games,
        });
    } catch (error) {
        res.status(500).json({
            error: errorTypes.SERVER_ERROR,
        });
    }
});

router.get("/games/:gameId/characters", async (req, res) => {
    const gameId = parseInt(req.params.gameId);
    if (Number.isNaN(gameId)) {
        return res.status(400).json({ error: "invalid gameId" });
    }
    try {
        const characters = await getCharacterIcons(gameId);
        res.status(200).json({ characters: characters });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

router.get("/games/:gameId", async (req, res) => {
    let gameId = req.params.gameId;
    try{
        gameId = parseInt(gameId)
    }
    catch(e){
        res.status(500).json({
            error: 'invalid Id'
        })
    }
    try {
        const game = await getGame(gameId);
        res.status(200).json({
            game: game,
        });
    } catch (error) {
        res.status(500).json({
            error: error,
        });
    }
});

export default router;