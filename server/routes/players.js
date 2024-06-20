import express from "express";
const router = express.Router();
import { numCheck, intCheck} from "../helpers.js";
import { getPlayer } from "../data/players.js"

router.get("/:playerId", async (req, res) => {
    let playerId = req.params.playerId;
    playerId = parseInt(playerId)
    try {
        const player = await getPlayer(playerId);
        console.log(player)
        res.status(200).json({
            player: player,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: errorTypes.SERVER_ERROR,
        });
    }
});

export default router;