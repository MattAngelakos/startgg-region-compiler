import express from "express";
import { getUser } from "../data/accounts.js";
const router = express.Router();

router.get("/:userId", async (req, res) => {
    let userId = req.params.userId;
    try {
        const user = await getUser(userId)
        res.status(200).json({
            user: user,
        });
    } catch (error) {
        res.status(500).json({
            error: error,
        });
    }
});

router.get("/:userId/bookmarks", async (req, res) => {
    let userId = req.params.userId;
    try {
        const user = await getUser(userId)
        res.status(200).json({
            bookmarks: user.bookmarks,
        });
    } catch (error) {
        res.status(500).json({
            error: error,
        });
    }
});

export default router;