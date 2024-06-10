import { arrayCheck, atLeast, createDate, idCheck, intCheck, numCheck, objectCheck, stringCheck } from '../helpers.js'
import { getPlayer } from './players.js'
import { editRegion, getRegion } from './regions.js'
import { getTournament } from './tournaments.js'

const getSeasonInfo = async (regionId, playerId, seasonName) => {
    seasonName = stringCheck(seasonName, "seasonName")
    atLeast(seasonName, 1, "seasonName")
    regionId = idCheck(regionId, "regionId")
    let region = await getRegion(regionId)
    numCheck(playerId, "playerId")
    intCheck(playerId, "playerId")
    const index = await getPlayer(regionId, playerId)
    return {region, index}
}

const createSeason = async (regionId, playerId, seasonName, startYear, startMonth, startDay, endYear, endMonth, endDay) => {
    seasonName = stringCheck(seasonName, "seasonName")
    atLeast(seasonName, 1, "seasonName")
    const startDate = createDate(startMonth, startDay, startYear)
    const endDate = createDate(endMonth, endDay, endYear)
    regionId = idCheck(regionId, "regionId")
    let region = await getRegion(regionId)
    numCheck(playerId, "playerId")
    intCheck(playerId, "playerId")
    const index = await getPlayer(regionId, playerId)
    if(region.players[index].seasons.findIndex(season => season.seasonName.toLowerCase() === seasonName.toLowerCase()) !== -1){
        throw `season with name ${seasonName} already exists`
    }
    let newSeason = {
        seasonName: seasonName,
        startDate: startDate,
        endDate: endDate,
        tournaments: [],
        wins: [],
        losses: [],
        characters: []
    }
    region.players[index].seasons.push(newSeason)
    await editRegion(regionId, region)
    return newSeason
}

const getAllSeasonsForPlayer = async (regionId, playerId) => {
    regionId = idCheck(regionId, "regionId")
    let region = await getRegion(regionId)
    numCheck(playerId, "playerId")
    intCheck(playerId, "playerId")
    let index = await getPlayer(regionId, playerId)
    return region.players[index].seasons
}

const getSeason = async (regionId, playerId, seasonName) => {
    let result = await getSeasonInfo(regionId, playerId, seasonName)
    const seasonIndex = (result.region).players[result.index].seasons.findIndex(season => season.seasonName === seasonName)
    if(seasonIndex === -1){
        throw `season with name ${seasonName} doesn't exist`
    }   
    return seasonIndex
}

const removeSeason = async (regionId, playerId, seasonName) => {
    let result = await getSeasonInfo(regionId, playerId, seasonName)
    const seasonIndex = (result.region).players[result.index].seasons.findIndex(season => season.seasonName === seasonName)
    if(seasonIndex === -1){
        throw `season with name ${seasonName} doesn't exist`
    }
    (result.region).players[result.index].seasons.splice(seasonIndex, 1)   
    await editRegion(regionId, (result.region))
    return (result.region).players[result.index].seasons
}

const editSeason = async (regionId, playerId, seasonName, editObject) => {
    let result = await getSeasonInfo(regionId, playerId, seasonName)
    const seasonIndex = await getSeason(regionId, playerId, seasonName)
    if("seasonName" in editObject){
        editObject.seasonName = stringCheck(editObject.seasonName, "seasonName")
        atLeast(editObject.seasonName, 1, "seasonName")
        if((result.region).players[result.index].seasons.findIndex(season => season.seasonName.toLowerCase() === editObject.seasonName.toLowerCase()) !== -1){
            throw `season with name ${editObject.seasonName} already exists`
        }
        (result.region).players[result.index].seasons[seasonIndex].seasonName = editObject.seasonName
    } 
    if("startDate" in editObject){
        numCheck(editObject.startDate, "startDate")
        intCheck(editObject.startDate, "startDate")
        if(editObject.startDate <= 0){
            throw 'invalid time'
        }
        (result.region).players[result.index].seasons[seasonIndex].startDate = editObject.startDate
    } 
    if("endDate" in editObject){
        numCheck(editObject.endDate, "endDate")
        intCheck(editObject.endDate, "endDate")
        if(editObject.endDate <= 0 || editObject.endDate <= editObject.startDate){
            throw 'invalid time'
        }
        (result.region).players[result.index].seasons[seasonIndex].endDate = editObject.endDate
    } 
    if("tournaments" in editObject){
        arrayCheck(editObject.tournaments, "tournaments")
        for (const element of editObject.tournaments) {
            objectCheck(element, "tournament")
        }
        (result.region).players[result.index].seasons[seasonIndex].tournaments = editObject.tournaments
    }
    if("wins" in editObject){
        arrayCheck(editObject.wins, "wins")
        for (const element of editObject.wins) {
            objectCheck(element, "win")
        }
        (result.region).players[result.index].seasons[seasonIndex].wins = editObject.wins
    }
    if("losses" in editObject){
        arrayCheck(editObject.losses, "losses")
        for (const element of editObject.losses) {
            objectCheck(element, "loss")
        }
        (result.region).players[result.index].seasons[seasonIndex].losses = editObject.losses
    }
    if("characters" in editObject){
        arrayCheck(editObject.characters, "characters")
        for (const element of editObject.characters) {
            objectCheck(element, "character")
        }
        (result.region).players[result.index].seasons[seasonIndex].characters = editObject.characters
    }
    await editRegion(regionId, (result.region));
    return (result.region).players[result.index].seasons[seasonIndex];
}

const editSeasonName = async (regionId, playerId, seasonName, newName) => {
    return await editSeason(regionId, playerId, seasonName, {seasonName: newName})
}

const editSeasonStart = async (regionId, playerId, seasonName, startYear, startMonth, startDay) => {
    const startDate = createDate(startMonth, startDay, startYear)
    return await editSeason(regionId, playerId, seasonName, {startDate: startDate})
}

const editSeasonEnd = async (regionId, playerId, seasonName, endYear, endMonth, endDay) => {
    const endDate = createDate(endMonth, endDay, endYear)
    return await editSeason(regionId, playerId, seasonName, {endDate: endDate})
}

const editSeasonTimeframe = async (regionId, playerId, seasonName, startYear, startMonth, startDay, endYear, endMonth, endDay) => {
    const startDate = createDate(startMonth, startDay, startYear)
    const endDate = createDate(endMonth, endDay, endYear)
    return await editSeason(regionId, playerId, seasonName, {startDate: startDate, endDate: endDate})
}

const createPlayerTourney = async (regionId, playerId, seasonName, tourneyId, placement) => {
    tourneyId = stringCheck(tourneyId, "tourneyId")
    atLeast(tourneyId, 1, "tourneyId")
    tourneyId = parseInt(tourneyId)
    numCheck(placement, "placement")
    intCheck(placement, "placement")
    if(placement <= 0) {
        throw 'invalid placement'
    }
    let result = await getSeasonInfo(regionId, playerId, seasonName)
    const seasonIndex = await getSeason(regionId, playerId, seasonName)
    const newTourney = {
        tourneyId: tourneyId,
        placement: placement 
    }
    await getTournament(tourneyId)
    const tourneyIndex = (result.region).players[result.index].seasons[seasonIndex].tournaments.findIndex(tournament => tournament.tourneyId === tourneyId)
    if(tourneyIndex !== -1){
        throw `tournament with id ${tourneyId} already exists`
    } 
    (result.region).players[result.index].seasons[seasonIndex].tournaments.push(newTourney)
    await editRegion(regionId, (result.region))
    return newTourney
}

const getPlayerTourney = async (regionId, playerId, seasonName, tourneyId) => {
    numCheck(tourneyId, "tourneyId")
    intCheck(tourneyId, "tourneyId")
    let result = await getSeasonInfo(regionId, playerId, seasonName)
    const seasonIndex = await getSeason(regionId, playerId, seasonName)
    const tourneyIndex = (result.region).players[result.index].seasons[seasonIndex].tournaments.findIndex(tournament => tournament.tourneyId === tourneyId)
    if(tourneyIndex === -1){
        throw `tournament with id ${tourneyId} doesn't exist`
    }   
    return tourneyIndex
}

const getAllPlayerTournamentsInSeason = async (regionId, playerId, seasonName) => {
    let region = await getRegion(regionId)
    let index = await getPlayer(regionId, playerId)
    let seasonIndex = await getSeason(regionId, playerId, seasonName)
    return region.players[index].seasons[seasonIndex].tournaments
}

const removePlayerTourney = async (regionId, playerId, seasonName, tourneyId) => {
    let result = await getSeasonInfo(regionId, playerId, seasonName)
    const seasonIndex = await getSeason(regionId, playerId, seasonName)
    const tourneyIndex = await getPlayerTourney(regionId, playerId, seasonName, tourneyId)  
    (result.region).players[result.index].seasons[seasonIndex].tournaments.splice(tourneyIndex, 1)   
    await editRegion(regionId, (result.region))
    return (result.region).players[result.index].seasons[seasonIndex].tournaments
}

const editPlayerTourney = async (regionId, playerId, seasonName, tourneyId, editObject) => {
    let result = await getSeasonInfo(regionId, playerId, seasonName)
    const seasonIndex = await getSeason(regionId, playerId, seasonName)
    const tourneyIndex = await getPlayerTourney(regionId, playerId, seasonName, tourneyId)
    if("tourneyId" in editObject){
        numCheck(editObject.tourneyId)
        intCheck(editObject.tourneyId)
        await getTournament(editObject.tourneyId)
        const tourneyIndexDup = (result.region).players[result.index].seasons[seasonIndex].tournaments.findIndex(tournament => tournament.tourneyId === editObject.tourneyId)
        if(tourneyIndexDup !== -1){
            throw `tournament with id ${editObject.tourneyId} already exists`
        } 
        (result.region).players[result.index].seasons[seasonIndex].tournaments[tourneyIndex].tourneyId = editObject.tourneyId
    }
    if("placement" in editObject){
        numCheck(editObject.placement)
        intCheck(editObject.placement)
        if(editObject.placement <= 0) {
            throw 'invalid placement'
        }
        (result.region).players[result.index].seasons[seasonIndex].tournaments[tourneyIndex].placement = editObject.placement
    }
    await editRegion(regionId, (result.region));
    return (result.region).players[result.index].seasons[seasonIndex].tournaments[tourneyIndex];
}

const editPlacement = async (regionId, playerId, seasonName, tourneyId, placement) => {
    return await editPlayerTourney(regionId, playerId, seasonName, tourneyId, {placement: placement})
}

const editTourneyId = async (regionId, playerId, seasonName, tourneyId, tourneyIdNew) => {
    return await editPlayerTourney(regionId, playerId, seasonName, tourneyId, {tourneyId: tourneyIdNew})
}
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

const createPlayerCharacter = async (regionId, playerId, seasonName, character) => {
    character = stringCheck(character, "tourneyId")
    atLeast(character, 1, "tourneyId")
    let result = await getSeasonInfo(regionId, playerId, seasonName)
    const seasonIndex = await getSeason(regionId, playerId, seasonName)
    const newCharacter = {
        characterName: character,
        numOfPlays: 1 
    }
    const characterIndex = (result.region).players[result.index].seasons[seasonIndex].characters.findIndex(characters => characters.characterName === character)
    if(characterIndex !== -1){
        throw `character ${character} already exists`
    } 
    (result.region).players[result.index].seasons[seasonIndex].characters.push(newCharacter)
    await editRegion(regionId, (result.region))
    return newCharacter
}

const getPlayerCharacter = async (regionId, playerId, seasonName, characterName) => {
    characterName = stringCheck(characterName)
    atLeast(characterName, 1, "characterName")
    let result = await getSeasonInfo(regionId, playerId, seasonName)
    const seasonIndex = await getSeason(regionId, playerId, seasonName)
    const characterIndex = (result.region).players[result.index].seasons[seasonIndex].characters.findIndex(character => character.characterName === characterName)
    if(characterIndex === -1){
        throw `character with name ${characterName} doesn't exist`
    }   
    return characterIndex
}

const removePlayerCharacter = async (regionId, playerId, seasonName, characterName) => {
    let result = await getSeasonInfo(regionId, playerId, seasonName)
    const seasonIndex = await getSeason(regionId, playerId, seasonName)
    const characterIndex = await getPlayerTourney(regionId, playerId, seasonName, characterName)  
    (result.region).players[result.index].seasons[seasonIndex].characters.splice(characterIndex, 1)   
    await editRegion(regionId, (result.region))
    return (result.region).players[result.index].seasons[seasonIndex].characters
}

const editPlayerCharacter = async (regionId, playerId, seasonName, characterName, editObject) => {
    let result = await getSeasonInfo(regionId, playerId, seasonName)
    const seasonIndex = await getSeason(regionId, playerId, seasonName)
    const characterIndex = await getPlayerCharacter(regionId, playerId, seasonName, characterName)
    if("characterName" in editObject){
        editObject.characterName = stringCheck(editObject.characterName)
        atLeast(editObject.characterName, 1, "characterName")
        const characterIndexDup = (result.region).players[result.index].seasons[seasonIndex].characters.findIndex(character => character.characterName === editObject.characterName)
        if(characterIndexDup !== -1){
            throw `character with name ${characterName} doesn't exist`
        } 
        (result.region).players[result.index].seasons[seasonIndex].characters[characterIndex].characterName = editObject.characterName
    }
    if("numOfPlays" in editObject){
        numCheck(editObject.numOfPlays)
        intCheck(editObject.numOfPlays)
        if(editObject.numOfPlays <= 0) {
            throw 'invalid plays'
        }
        (result.region).players[result.index].seasons[seasonIndex].characters[characterIndex].numOfPlays = editObject.numOfPlays
    }
    await editRegion(regionId, (result.region));
    return (result.region).players[result.index].seasons[seasonIndex].characters[characterIndex];
}

const addPlay = async (regionId, playerId, seasonName, characterName) => {
    let result = await getSeasonInfo(regionId, playerId, seasonName)
    const seasonIndex = await getSeason(regionId, playerId, seasonName)
    const characterIndex = await getPlayerCharacter(regionId, playerId, seasonName, characterName)
    const newChar = {
        numOfPlays: (result.region).players[result.index].seasons[seasonIndex].characters[characterIndex].numOfPlays + 1
    }
    await editPlayerCharacter(regionId, playerId, seasonName, (result.region).players[result.index].seasons[seasonIndex].characters[characterIndex].characterName, newChar)

}

export{
    createSeason,
    getAllSeasonsForPlayer,
    getSeason,
    removeSeason,
    editSeason,
    editSeasonName,
    editSeasonStart,
    editSeasonEnd,
    editSeasonTimeframe,
    getSeasonInfo,
    createPlayerTourney,
    getPlayerTourney,
    getAllPlayerTournamentsInSeason,
    removePlayerTourney,
    editPlayerTourney,
    editPlacement,
    editTourneyId,
    createPlayerWin,
    createPlayerLoss,
    getAllPlayerWins,
    getPlayerWin,
    removePlayerWin,
    editPlayerWin,
    getPlayerLoss,
    getAllPlayerLosses,
    removePlayerLoss,
    editPlayerLoss,
    createPlayerCharacter,
    getPlayerCharacter,
    removePlayerCharacter,
    editPlayerCharacter,
    addPlay
}