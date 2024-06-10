import { arrayCheck, atLeast, intCheck, numCheck, objectCheck, stringCheck } from '../helpers.js'
import { getPlayer } from './players.js'
import { editRegion, getRegion } from './regions.js'
import { getSeason, getSeasonInfo } from './seasons.js';
import { getTournament } from './tournaments.js'

const validateOpponentAndSetId = (opponentId, setId) => {
    numCheck(opponentId, "opponentId");
    intCheck(opponentId, "opponentId");
    if (setId !== undefined) {
        numCheck(setId, "setId");
        intCheck(setId, "setId");
    }
};

const createPlayerRecord = async (type, regionId, playerId, seasonName, tourneyId, opponentName, opponentId, setId) => {
    validateOpponentAndSetId(opponentId, setId);
    opponentName = stringCheck(opponentName, "opponentName");
    atLeast(opponentName, 1, "opponentName");

    let result = await getSeasonInfo(regionId, playerId, seasonName);
    const seasonIndex = await getSeason(regionId, playerId, seasonName);
    await getTournament(tourneyId);

    const newRecord = {
        opponentId: opponentId,
        opponentName: opponentName,
        tournaments: setId ? [{ setId: setId, tourneyId: tourneyId }] : [tourneyId]
    };
    const records = result.region.players[result.index].seasons[seasonIndex][type];
    const recordIndex = records.findIndex(record => record.opponentId === opponentId);
    if (recordIndex !== -1) {
        throw `${type.slice(0, -1)} with id ${opponentId} already exists`;
    }
    if (setId && recordIndex !== -1) {
        const setIndex = records[recordIndex].tournaments.findIndex(record => record.setId === setId);
        if (setIndex !== -1) {
            throw `${type.slice(0, -1)} with setId ${setId} already exists`;
        }
    }
    records.push(newRecord);
    await editRegion(regionId, result.region);
    return newRecord;
};

const getAllPlayerRecords = async (type, regionId, playerId, seasonName) => {
    let region = await getRegion(regionId);
    let index = await getPlayer(regionId, playerId);
    let seasonIndex = await getSeason(regionId, playerId, seasonName);
    return region.players[index].seasons[seasonIndex][type]
};

const getPlayerRecord = async (type, regionId, playerId, seasonName, opponentId) => {
    validateOpponentAndSetId(opponentId);

    let result = await getSeasonInfo(regionId, playerId, seasonName);
    const seasonIndex = await getSeason(regionId, playerId, seasonName);
    const records = result.region.players[result.index].seasons[seasonIndex][type];
    const recordIndex = records.findIndex(record => record.opponentId === opponentId);

    if (recordIndex === -1) {
        throw `${type.slice(0, -1)} with opponentId ${opponentId} doesn't exist`;
    }

    return recordIndex;
};

const removePlayerRecord = async (type, regionId, playerId, seasonName, opponentId) => {
    let result = await getSeasonInfo(regionId, playerId, seasonName);
    const seasonIndex = await getSeason(regionId, playerId, seasonName);
    const records = result.region.players[result.index].seasons[seasonIndex][type];
    const recordIndex = await getPlayerRecord(type, regionId, playerId, seasonName, opponentId);
    
    records.splice(recordIndex, 1);
    await editRegion(regionId, result.region);
    return records;
};

const editPlayerRecord = async (type, regionId, playerId, seasonName, opponentId, editObject) => {
    let result = await getSeasonInfo(regionId, playerId, seasonName);
    const seasonIndex = await getSeason(regionId, playerId, seasonName);
    const records = result.region.players[result.index].seasons[seasonIndex][type];
    const recordIndex = await getPlayerRecord(type, regionId, playerId, seasonName, opponentId);

    if ("opponentId" in editObject) {
        validateOpponentAndSetId(editObject.opponentId);
        const recordIndexDup = records.findIndex(record => record.opponentId === editObject.opponentId);
        if (recordIndexDup !== -1) {
            throw `${type.slice(0, -1)} with id ${editObject.opponentId} already exists`;
        }
        records[recordIndex].opponentId = editObject.opponentId;
    }
    if ("opponentName" in editObject) {
        editObject.opponentName = stringCheck(editObject.opponentName, "opponentName");
        atLeast(editObject.opponentName, 1, "opponentName");
        records[recordIndex].opponentName = editObject.opponentName;
    }
    if ("tournaments" in editObject) {
        arrayCheck(editObject.tournaments, "tournaments");
        for (const element of editObject.tournaments) {
            objectCheck(element, "tournament");
        }
        records[recordIndex].tournaments = editObject.tournaments;
    }
    await editRegion(regionId, result.region);
    return records[recordIndex];
};

// Wrapper functions for wins and losses

const createPlayerWin = async (regionId, playerId, seasonName, tourneyId, opponentName, opponentId, setId) => {
    return await createPlayerRecord('wins', regionId, playerId, seasonName, tourneyId, opponentName, opponentId, setId);
};

const createPlayerLoss = async (regionId, playerId, seasonName, tourneyId, opponentName, opponentId, setId) => {
    return await createPlayerRecord('losses', regionId, playerId, seasonName, tourneyId, opponentName, opponentId, setId);
};

const getAllPlayerWins = async (regionId, playerId, seasonName) => {
    return await getAllPlayerRecords('wins', regionId, playerId, seasonName);
};

const getAllPlayerLosses = async (regionId, playerId, seasonName) => {
    return await getAllPlayerRecords('losses', regionId, playerId, seasonName);
};

const getPlayerWin = async (regionId, playerId, seasonName, opponentId) => {
    return await getPlayerRecord('wins', regionId, playerId, seasonName, opponentId);
};

const getPlayerLoss = async (regionId, playerId, seasonName, opponentId) => {
    return await getPlayerRecord('losses', regionId, playerId, seasonName, opponentId);
};

const removePlayerWin = async (regionId, playerId, seasonName, opponentId) => {
    return await removePlayerRecord('wins', regionId, playerId, seasonName, opponentId);
};

const removePlayerLoss = async (regionId, playerId, seasonName, opponentId) => {
    return await removePlayerRecord('losses', regionId, playerId, seasonName, opponentId);
};

const editPlayerWin = async (regionId, playerId, seasonName, opponentId, editObject) => {
    return await editPlayerRecord('wins', regionId, playerId, seasonName, opponentId, editObject);
};

const editPlayerLoss = async (regionId, playerId, seasonName, opponentId, editObject) => {
    return await editPlayerRecord('losses', regionId, playerId, seasonName, opponentId, editObject);
};

export{
    createPlayerWin,
    createPlayerLoss,
    getAllPlayerWins,
    getPlayerWin,
    removePlayerWin,
    editPlayerWin,
    getPlayerLoss,
    getAllPlayerLosses,
    removePlayerLoss,
    editPlayerLoss
}