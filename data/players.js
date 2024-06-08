import { arrayCheck, doRequest, idCheck, intCheck, numCheck, objectCheck, stringCheck } from '../helpers.js'
import { editRegion, getRegion } from './regions.js'

const createPlayer = async (regionId, playerId) => {
    regionId = idCheck(regionId, "regionId")
    let region = await getRegion(regionId)
    numCheck(playerId, "playerId")
    intCheck(playerId, "playerId")
    if(region.players.findIndex(player => player.playerId === playerId) !== -1){
        throw `player with id ${playerId} already exists`
    }
    const query = `
    query Name($id: ID!) {
        player(id: $id) {
            gamerTag
        }
    }
    `
    const data = await doRequest(query, playerId, 0, 0, 0)
    let newPlayer = {
        playerId: playerId,
        gamerTag: data.data.player.gamerTag,
        seasons: []
    }
    region.players.push(newPlayer)
    await editRegion(regionId, region)
    return newPlayer
}

const getAllPlayersByRegion = async (regionId) => {
    regionId = idCheck(regionId, "regionId")
    let region = await getRegion(regionId)
    return region.players
}

const getPlayer = async (regionId, playerId) => {
    regionId = idCheck(regionId, "regionId")
    let region = await getRegion(regionId)
    numCheck(playerId, "playerId")
    intCheck(playerId, "playerId")
    const index = region.players.findIndex(player => player.playerId === playerId)
    if(index === -1){
        throw `player of ${playerId} does not exist`
    }
    return index
}

const removePlayer = async (regionId, playerId) => {
    regionId = idCheck(regionId, "regionId")
    let region = await getRegion(regionId)
    numCheck(playerId, "playerId")
    intCheck(playerId, "playerId")
    const index = region.players.findIndex(player => player.playerId === playerId)
    if(index === -1){
        throw `player of ${playerId} does not exist`
    }
    region.players.splice(index, 1)
    await editRegion(regionId, region)
    return region.players
}

const editPlayer = async (regionId, playerId, editObject) => {
    regionId = idCheck(regionId, "regionId")
    let region = await getRegion(regionId)
    numCheck(playerId, "playerId")
    intCheck(playerId, "playerId")
    let index = await getPlayer(regionId, playerId)
    if("gamerTag" in editObject){
        editObject.gamerTag = stringCheck(editObject.gamerTag, "gamerTag")
        region.players[index].gamerTag = editObject.gamerTag
    } 
    if("seasons" in editObject){
        arrayCheck(editObject.seasons, "seasons")
        for (const element of editObject.seasons) {
            objectCheck(element, "season")
        }
        region.players[index].seasons = editObject.seasons
    }
    await editRegion(regionId, region);
    return region.players[index];
}

const changeName = async (regionId, playerId, newName) => {
    return await editPlayer(regionId, playerId, {gamerTag: newName})
}

export{
    createPlayer,
    getPlayer,
    getAllPlayersByRegion,
    removePlayer,
    editPlayer,
    changeName
}