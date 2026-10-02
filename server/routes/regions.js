import express from "express";
import { getRegionSeasonSummaries } from '../data/summaries.js';
import { getAllRegions, getRegion } from "../data/regions.js";
import { getSeason } from "../data/seasons.js";
import { do_elo, do_glicko2, do_h2h, finish_h2h, getSeasonMatches, buildSeasonContext, getSeasonPlayerSummaries, getEventResultsByRegion, getTournamentsBySeason, seasonFilter } from "../data/playerData.js";
import { arrayCheck, atLeast, intCheck, numCheck, stringCheck } from "../helpers.js";
import { getPlayer } from "../data/players.js";
import _ from 'lodash';
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

router.get("/:regionId/seasons-summary", async (req, res) => {
    try {
        const summary = await getRegionSeasonSummaries(req.params.regionId);
        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

router.get("/:regionId/seasons/:seasonName/players-summary", async (req, res) => {
    let seasonName = req.params.seasonName;
    try {
        seasonName = stringCheck(seasonName, "seasonName").toLowerCase();
        atLeast(seasonName, 1, "seasonName");
    } catch (e) {
        return res.status(400).json({ error: 'season name must be a non empty string' });
    }
    try {
        const summary = await getSeasonPlayerSummaries(req.params.regionId, seasonName);
        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({ error: String(error) });
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

router.get("/:regionId/seasons/:seasonName/tournaments/:tournamentId/events/:eventId", async (req, res) => {
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

router.get("/:regionId/seasons/:seasonName/stats/head-to-head", async (req, res) => {
    let regionId = req.params.regionId;
    let seasonName = req.params.seasonName;
    try{
        seasonName = seasonName.trim()
        atLeast(seasonName, 1, "seasonName")
        seasonName = seasonName.toLowerCase()
    }catch(e){
        return res.status(400).json({ error: 'season name be a non empty string' });
    }
    try {
        const context = await buildSeasonContext(regionId, seasonName)
        const unfinished_h2h = context.h2h
        const matches = context.matches
        let h2h = _.cloneDeep(unfinished_h2h);
        h2h = do_elo(h2h, matches)
        h2h = do_glicko2(h2h, matches)
        h2h = finish_h2h(h2h)
        res.status(200).json({
            h2h: h2h,
            unfinished_h2h: unfinished_h2h
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: error,
        });
    }
})

router.post("/:regionId/seasons/:seasonName/stats/head-to-head", async (req, res) => {
    let { regionId, seasonName } = req.params;
    // tournaments: eventIds to exclude. players: playerIds to keep (omit for all).
    const { tournaments, players } = req.body;
    try{
        parseInt(regionId)
    }catch(e){
        return res.status(401).json({ error: 'regionId be an int' });
    }
    try{
        seasonName = seasonName.trim()
        atLeast(seasonName, 1, "seasonName")
        seasonName = seasonName.toLowerCase()
    }catch(e){
        return res.status(402).json({ error: 'season name be a non empty string' });
    }
    try{
        arrayCheck(tournaments)
    }catch(e){
        return res.status(403).json({ error: 'tournaments must be an array' });
    }
    if (players !== undefined && players !== null) {
        try{
            arrayCheck(players)
        }catch(e){
            return res.status(403).json({ error: 'players must be an array' });
        }
    }
    try {
        const context = await buildSeasonContext(regionId, seasonName, tournaments, players)
        let unfinished_h2h = context.h2h
        const matches = context.matches
        let h2h = _.cloneDeep(unfinished_h2h);
        h2h = do_elo(h2h, matches)
        h2h = do_glicko2(h2h, matches)
        h2h = finish_h2h(h2h)
        res.status(200).json({
            h2h: h2h,
            unfinished_h2h: unfinished_h2h
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: error,
        });
    }
})

router.get("/:regionId/seasons/:seasonName/tournaments", async (req, res) => {
    let regionId = req.params.regionId;
    let seasonName = req.params.seasonName;
    try{
        seasonName = seasonName.trim()
        atLeast(seasonName, 1, "seasonName")
        seasonName = seasonName.toLowerCase()
    }catch(e){
        return res.status(400).json({ error: 'season name be a non empty string' });
    }
    try {
        // ?counts=0 skips the roster-vs-roster tally for callers that only
        // need bracket names and dates.
        const withCounts = req.query.counts !== '0' && req.query.counts !== 'false'
        const results = await getTournamentsBySeason(regionId, seasonName, withCounts)
        res.status(200).json({
            results: results,
        });
    } catch (error) {
        res.status(500).json({
            error: error,
        });
    }
});

export default router;