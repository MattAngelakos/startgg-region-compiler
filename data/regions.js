import {players} from '../config/mongoCollections.js'
import {ObjectId} from 'mongodb'
import { arrayCheck, atLeast, booleanCheck, idCheck, intCheck, numCheck, objectCheck, stringCheck } from '../helpers.js'

const createRegion = async (regionName, gameId, onlineAllowed, minimumEntrants) => {
    regionName = stringCheck(regionName, "regionName")
    numCheck(gameId, "gameId")
    intCheck(gameId, "gameId")
    booleanCheck(onlineAllowed, "onlineAllowed")
    numCheck(minimumEntrants, "minimumEntrants")
    intCheck(minimumEntrants, "minimumEntrants")
    atLeast(minimumEntrants, 2, "minimumEntrants")
    const playerCollection = await players()
    let newRegion = {
        regionName: regionName,
        players: [],
        gameId: gameId,
        onlineAllowed: onlineAllowed,
        minimumEntrants: minimumEntrants
    }
    const insertInfo = await playerCollection.insertOne(newRegion)
    if (!insertInfo.acknowledged || !insertInfo.insertedId)
        throw 'Could not add region'
    const newId = insertInfo.insertedId.toString()
    const region = await getRegion(newId)
    return region;
}

const getAllRegions = async () => {
    const regions = await players()
    let regionList = await regions.find({}).toArray()
    if (!regionList) throw 'Could not get all region'
    return regionList
}

const getRegion = async (id) => {
    let x = new ObjectId()
    id = idCheck(id, "regionId")
    const playerCollection = await players()
    const findRegion = await playerCollection.findOne({_id: new ObjectId(id)})
    if (findRegion === null) throw `No region with that id: ${id}`
    findRegion._id = findRegion._id.toString();
    return findRegion
};

const removeRegion = async (id) => {
    id = idCheck(id, "regionId")
    const playerCollection = await players()
    const deletionInfo = await playerCollection.findOneAndDelete({
      _id: new ObjectId(id)
    })
    if (!deletionInfo) {
      throw `Could not delete region id: ${id}`
    }
    return `${deletionInfo.regionName} has been successfully deleted!`
};

const editRegion = async (id, editObject) => {
    id = idCheck(id, "regionId")
    objectCheck(editObject, "regionEditObject")  
    let updatedRegion = await getRegion(id)
    if("regionName" in editObject){
        editObject.regionName = stringCheck(editObject.regionName, "regionName")
        updatedRegion.regionName = editObject.regionName
    }
    if("players" in editObject){
        arrayCheck(editObject.players, "players")
        for (const element of editObject.players) {
            objectCheck(element, "player")
        }
        updatedRegion.players = editObject.players
    }
    if("gameId" in editObject){
        numCheck(editObject.gameId, "gameId")
        intCheck(editObject.gameId, "gameId")
        updatedRegion.gameId = editObject.gameId
    }
    if("minimumEntrants" in editObject){
        numCheck(editObject.minimumEntrants, "minimumEntrants")
        intCheck(editObject.minimumEntrants, "minimumEntrants")
        atLeast(editObject.minimumEntrants, 2, "minimumEntrants")
        updatedRegion.minimumEntrants = editObject.minimumEntrants
    }
    if("onlineAllowed" in editObject){
        booleanCheck(editObject.onlineAllowed, "onlineAllowed")
        updatedRegion.onlineAllowed = editObject.onlineAllowed
    }
    const playerCollection = await players();
    delete updatedRegion._id;
    const updatedInfo = await playerCollection.findOneAndUpdate(
        {_id: new ObjectId(id)},
        {$set: updatedRegion},
        {returnDocument: 'after'}
      )
    if (!updatedInfo) {
        throw 'could not update region successfully'
    }
    updatedInfo._id = updatedInfo._id.toString()
    return updatedInfo
}

export{
    createRegion,
    getAllRegions,
    getRegion,
    removeRegion,
    editRegion
}