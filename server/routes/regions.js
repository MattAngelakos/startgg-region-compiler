import express from "express";
import { getAllRegions, getRegion } from "../data/regions.js";
import { getSeason } from "../data/seasons.js";
import { do_h2h, finish_h2h, getEventResultsByRegion, seasonFilter } from "../data/playerData.js";
import { atLeast } from "../helpers.js";
import { getPlayer } from "../data/players.js";
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const regions = await getAllRegions();
        res.status(200).json({
            regions: regions,
        });
    } catch (error) {
        res.status(500).json({
            error: errorTypes.SERVER_ERROR,
        });
    }
});

router.get("/:regionId", async (req, res) => {
    let regionId = req.params.regionId;
    try {
        const region = await getRegion(regionId);
        res.status(200).json({
            region: region,
        });
    } catch (error) {
        res.status(500).json({
            error: error,
        });
    }
});

router.get("/:regionId/seasons/:seasonName", async (req, res) => {
    let regionId = req.params.regionId;
    let seasonName = req.params.seasonName;
    seasonName = seasonName.trim()
    atLeast(seasonName, 1, "seasonName")
    seasonName = seasonName.toLowerCase()
    try {
        const region = await getRegion(regionId);
        const index = await getSeason(regionId, seasonName)
        res.status(200).json({
            [regionId]: region.seasons[index],
        });
    } catch (error) {
        res.status(500).json({
            error: error,
        });
    }
});

router.get("/:regionId/seasons/:seasonName/players", async (req, res) => {
    let regionId = req.params.regionId;
    let seasonName = req.params.seasonName;
    seasonName = seasonName.trim()
    atLeast(seasonName, 1, "seasonName")
    seasonName = seasonName.toLowerCase()
    try {
        const region = await getRegion(regionId);
        const index = await getSeason(regionId, seasonName)
        let players = []
        for(const playerId of region.seasons[index].players){
            players.push(await getPlayer(playerId))
        }
        res.status(200).json({
            players: players,
        });
    } catch (error) {
        res.status(500).json({
            error: error,
        });
    }
});


router.get("/:regionId/seasons/:seasonName/players/:playerId", async (req, res) => {
    let regionId = req.params.regionId;
    let seasonName = req.params.seasonName;
    let playerId = req.params.playerId;
    seasonName = seasonName.trim()
    atLeast(seasonName, 1, "seasonName")
    seasonName = seasonName.toLowerCase()
    try{
        playerId = parseInt(playerId)
    }
    catch(e){
        res.status(500).json({
            error: 'invalid Id'
        })
    }
    try {
        const player = await seasonFilter(regionId, seasonName, playerId)
        res.status(200).json({
            player: player,
        });
    } catch (error) {
        res.status(500).json({
            error: error,
        });
    }
});

router.get("/:regionId/:seasonName/tournaments/:tournamentId/events/:eventId", async (req, res) => {
    let regionId = req.params.regionId;
    let seasonName = req.params.seasonName;
    let tournamentId = req.params.tournamentId;
    let eventId = req.params.eventId;
    seasonName = seasonName.trim()
    atLeast(seasonName, 1, "seasonName")
    seasonName = seasonName.toLowerCase()
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
        const results = await getEventResultsByRegion(regionId, seasonName, tournamentId, eventId)
        res.status(200).json({
            results: results,
        });
    } catch (error) {
        res.status(500).json({
            error: error,
        });
    }
});

router.get("/:regionId/:seasonName/stats/head-to-head", async (req, res) => {
    let regionId = req.params.regionId;
    let seasonName = req.params.seasonName;
    seasonName = seasonName.trim()
    atLeast(seasonName, 1, "seasonName")
    seasonName = seasonName.toLowerCase()
    try {
        let h2h = await do_h2h(regionId, seasonName)
        h2h = await finish_h2h(h2h)
        res.status(200).json({
            h2h: h2h,
        });
    } catch (error) {
        res.status(500).json({
            error: error,
        });
    }
});

export default router;