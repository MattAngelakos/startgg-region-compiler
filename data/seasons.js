import { atLeast, createDate, idCheck, intCheck, numCheck, stringCheck } from '../helpers.js'
import { editRegion, getRegion } from './regions.js'

const createSeason = async (regionId, seasonName, startYear, startMonth, startDay, endYear, endMonth, endDay) => {
    seasonName = stringCheck(seasonName, "seasonName")
    atLeast(seasonName, 1, "seasonName")
    const startDate = createDate(startMonth, startDay, startYear)
    const endDate = createDate(endMonth, endDay, endYear)
    if(endDate < 0 || endDate <= startDate || startDate < 0){
        throw 'invalid time'
    }
    regionId = idCheck(regionId, "regionId")
    let region = await getRegion(regionId)
    if(region.seasons.findIndex(season => season.seasonName.toLowerCase() === seasonName.toLowerCase()) !== -1){
        throw `season with name ${seasonName} already exists`
    }
    let newSeason = {
        seasonName: seasonName,
        startDate: startDate,
        endDate: endDate
    }
    region.seasons.push(newSeason)
    await editRegion(regionId, region)
    return newSeason
}

const getAllSeasonsForPlayer = async (regionId) => {
    regionId = idCheck(regionId, "regionId")
    let region = await getRegion(regionId)
    return region.seasons
}

const getSeason = async (regionId, seasonName) => {
    let region = await getRegion(regionId)
    const seasonIndex = region.seasons.findIndex(season => season.seasonName === seasonName)
    if(seasonIndex === -1){
        throw `season with name ${seasonName} doesn't exist`
    }   
    return seasonIndex
}

const removeSeason = async (regionId, playerId, seasonName) => {
    let region = await getRegion(regionId)
    const seasonIndex = region.seasons.findIndex(season => season.seasonName === seasonName)
    if(seasonIndex === -1){
        throw `season with name ${seasonName} doesn't exist`
    }  
    region.seasons.splice(seasonIndex, 1)   
    await editRegion(regionId, region)
    return region.seasons
}

const editSeason = async (regionId, seasonName, editObject) => {
    let region = await getRegion(regionId)
    const seasonIndex = await getSeason(regionId, seasonName)
    if("seasonName" in editObject){
        editObject.seasonName = stringCheck(editObject.seasonName, "seasonName")
        atLeast(editObject.seasonName, 1, "seasonName")
        if(region.seasons.findIndex(season => season.seasonName.toLowerCase() === editObject.seasonName.toLowerCase()) !== -1){
            throw `season with name ${editObject.seasonName} already exists`
        }
        region.seasons[seasonIndex].seasonName = editObject.seasonName
    } 
    if("startDate" in editObject){
        numCheck(editObject.startDate, "startDate")
        intCheck(editObject.startDate, "startDate")
        if(editObject.startDate < 0 || editObject.startDate >= region.seasons[seasonIndex].endDate){
            throw 'invalid time'
        }
        region.seasons[seasonIndex].startDate = editObject.startDate
    } 
    if("endDate" in editObject){
        numCheck(editObject.endDate, "endDate")
        intCheck(editObject.endDate, "endDate")
        if(editObject.endDate < 0 || editObject.endDate <= region.seasons[seasonIndex].startDate){
            throw 'invalid time'
        }
        region.seasons[seasonIndex].endDate = editObject.endDate
    } 
    // if("characters" in editObject){
    //     arrayCheck(editObject.characters, "characters")
    //     for (const element of editObject.characters) {
    //         objectCheck(element, "character")
    //     }
    //     (result.region).players[result.index].seasons[seasonIndex].characters = editObject.characters
    // }
    await editRegion(regionId, region);
    return region.seasons[seasonIndex];
}

const editSeasonName = async (regionId, seasonName, newName) => {
    return await editSeason(regionId, seasonName, {seasonName: newName})
}

const editSeasonStart = async (regionId, seasonName, startYear, startMonth, startDay) => {
    const startDate = createDate(startMonth, startDay, startYear)
    return await editSeason(regionId, seasonName, {startDate: startDate})
}

const editSeasonEnd = async (regionId, seasonName, endYear, endMonth, endDay) => {
    const endDate = createDate(endMonth, endDay, endYear)
    return await editSeason(regionId, seasonName, {endDate: endDate})
}

const editSeasonTimeframe = async (regionId, seasonName, startYear, startMonth, startDay, endYear, endMonth, endDay) => {
    const startDate = createDate(startMonth, startDay, startYear)
    const endDate = createDate(endMonth, endDay, endYear)
    return await editSeason(regionId, seasonName, {startDate: startDate, endDate: endDate})
}
// const filterPlayerTournaments = async (regionId, seasonName, tournamentIds) => {
//     arrayCheck(tournamentIds, "tourneyIds")
//     for(const id of tournamentIds){
//         numCheck(id, "tourneyId")
//         intCheck(id, "tourneyId")
//     }
//     let region = await getRegion(regionId)
//     for(let i = 0; i < region.players.length; i++){
//         try{
//             const seasonIndex = await getSeason(regionId, region.players[i].playerId, seasonName)
//             region.players[i].seasons[seasonIndex].tournaments = region.players[i].seasons[seasonIndex].tournaments.filter(tournament => !tournamentIds.includes(tournament.tourneyId))
//         }
//         catch(e){
//             console.error(e)
//         }
//     }
//     return region
// }


export{
    createSeason,
    getAllSeasonsForPlayer,
    getSeason,
    removeSeason,
    editSeason,
    editSeasonName,
    editSeasonStart,
    editSeasonEnd,
    editSeasonTimeframe
}