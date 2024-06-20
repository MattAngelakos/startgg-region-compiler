import express from "express";
const router = express.Router();
import { numCheck, intCheck} from "../helpers.js";
import { getAllPlayers, getGameFromPlayer, getPlayer } from "../data/players.js"


router.get("/", async (req, res) => {
    try {
        const players = await getAllPlayers();
        res.status(200).json({
            players: players,
        });
    } catch (error) {
        res.status(500).json({
            error: errorTypes.SERVER_ERROR,
        });
    }
});

router.get("/:playerId", async (req, res) => {
    let playerId = req.params.playerId;
    try{
        playerId = parseInt(playerId)
    }
    catch(e){
        res.status(500).json({
            error: 'invalid Id'
        })
    }
    try {
        const player = await getPlayer(playerId);
        res.status(200).json({
            player: player,
        });
    } catch (error) {
        res.status(500).json({
            error: error,
        });
    }
});

router.get("/:playerId/:gameId", async (req, res) => {
    let playerId = req.params.playerId;
    let gameId = req.params.gameId;
    try{
        playerId = parseInt(playerId)
    }
    catch(e){
        res.status(500).json({
            error: 'invalid playerId'
        })
    }
    try{
        gameId = parseInt(gameId)
    }
    catch(e){
        res.status(500).json({
            error: 'invalid gameId'
        })
    }
    try {
        const player = await getPlayer(playerId);
        const index = await getGameFromPlayer(playerId, gameId)
        res.status(200).json({
            [player._id]: player.games[index],
        });
    } catch (error) {
        res.status(500).json({
            error: error,
        });
    }
});


export default router;