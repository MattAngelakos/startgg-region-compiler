import express from "express";
import { getAllTournaments, getMainTournament, getTournament } from "../data/tournaments.js";
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const tournaments = await getAllTournaments();
        res.status(200).json({
            tournaments: tournaments,
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: errorTypes.SERVER_ERROR,
        });
    }
});

router.get("/:tournamentId", async (req, res) => {
    let tournamentId = req.params.tournamentId;
    try{
        tournamentId = parseInt(tournamentId)
    }
    catch(e){
        res.status(500).json({
            error: 'invalid Id'
        })
    }
    try {
        const tournament = await getMainTournament(tournamentId);
        res.status(200).json({
            tournament: tournament,
        });
    } catch (error) {
        res.status(500).json({
            error: error,
        });
    }
});

router.get("/:tournamentId/:eventId", async (req, res) => {
    let tournamentId = req.params.tournamentId;
    let eventId = req.params.eventId;
    try{
        tournamentId = parseInt(tournamentId)
    }
    catch(e){
        res.status(500).json({
            error: 'invalid tournamentId'
        })
    }
    try{
        eventId = parseInt(eventId)
    }
    catch(e){
        res.status(500).json({
            error: 'invalid eventId'
        })
    }
    try {
        const tournament = await getMainTournament(tournamentId)
        const event = await getTournament(tournamentId, eventId)
        res.status(200).json({
            [tournament._id]: tournament.events[event],
        });
    } catch (error) {
        res.status(500).json({
            error: error,
        });
    }
});

export default router;