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
    editTourneyId
}