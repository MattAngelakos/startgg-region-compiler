import express from "express";
import { getAllRegions, getRegion } from "../data/regions.js";
import { getSeason } from "../data/seasons.js";
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

router.get("/:regionId/:seasonName", async (req, res) => {
    let regionId = req.params.regionId;
    let seasonName = req.params.seasonName;
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

export default router;