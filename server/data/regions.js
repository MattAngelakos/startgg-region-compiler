import {regions} from '../config/mongoCollections.js'
import {ObjectId} from 'mongodb'
import { arrayCheck, atLeast, booleanCheck, idCheck, intCheck, numCheck, objectCheck, stringCheck } from '../helpers.js'

const createRegion = async (regionName, gameId, onlineAllowed, minimumEntrants, minimumEvents, minimumUniqueEvents, addrState, minimumEventsInAddrState, ownerId) => {
    regionName = stringCheck(regionName, "regionName")
    atLeast(addrState, 1, "regionName")
    addrState = stringCheck(addrState, "addrState")
    atLeast(addrState, 1, "addrState")
    numCheck(gameId, "gameId")
    intCheck(gameId, "gameId")
    idCheck(ownerId, "ownerId")
    booleanCheck(onlineAllowed, "onlineAllowed")
    numCheck(minimumEntrants, "minimumEntrants")
    intCheck(minimumEntrants, "minimumEntrants")
    atLeast(minimumEntrants, 2, "minimumEntrants")
    numCheck(minimumEvents, "minimumEvents")
    intCheck(minimumEvents, "minimumEvents")
    atLeast(minimumEvents, 1, "minimumEvents")
    numCheck(minimumUniqueEvents, "minimumUniqueEvents")
    intCheck(minimumUniqueEvents, "minimumUniqueEvents")
    atLeast(minimumUniqueEvents, 1, "minimumUniqueEvents")
    numCheck(minimumEventsInAddrState, "minimumEventsInAddrState")
    intCheck(minimumEventsInAddrState, "minimumEventsInAddrState")
    atLeast(minimumEventsInAddrState, 0, "minimumEventsInAddrState")
    const regionCollection = await regions()
    let newRegion = {
        regionName: regionName,
        addrState: addrState,
        ownerId: ownerId,
        seasons: [],
        gameId: gameId,
        onlineAllowed: onlineAllowed,
        minimumEntrants: minimumEntrants,
        minimumEvents: minimumEvents,
        minimumUniqueEvents: minimumUniqueEvents,
        minimumEventsInAddrState: minimumEventsInAddrState,
        numOfLikes: 0
    }
    const insertInfo = await regionCollection.insertOne(newRegion)
    if (!insertInfo.acknowledged || !insertInfo.insertedId)
        throw 'Could not add region'
    const newId = insertInfo.insertedId.toString()
    const region = await getRegion(newId)
    return region;
}

const getAllRegions = async () => {
    const regions2 = await regions()
    let regionList = await regions2.find({}).toArray()
    if (!regionList) throw 'Could not get all region'
    return regionList
}

const getRegion = async (id) => {
    let x = new ObjectId()
    id = idCheck(id, "regionId")
    const regionCollection = await regions()
    const findRegion = await regionCollection.findOne({_id: new ObjectId(id)})
    if (findRegion === null) throw `No region with that id: ${id}`
    findRegion._id = findRegion._id.toString();
    return findRegion
};

const removeRegion = async (id) => {
    id = idCheck(id, "regionId")
    const regionCollection = await regions()
    const deletionInfo = await regionCollection.findOneAndDelete({
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
        atLeast(editObject.regionName, 1, "regionName")
        updatedRegion.regionName = editObject.regionName
    }
    if("addrState" in editObject){
        editObject.addrState = stringCheck(editObject.addrState, "addrState")
        atLeast(editObject.addrState, 1, "addrState")
        updatedRegion.addrState = editObject.addrState
    }
    if("seasons" in editObject){
        arrayCheck(editObject.seasons, "seasons")
        for (const element of editObject.seasons) {
            objectCheck(element, "season")
        }
        updatedRegion.seasons = editObject.seasons
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
    if("minimumEvents" in editObject){
        numCheck(editObject.minimumEvents, "minimumEvents")
        intCheck(editObject.minimumEvents, "minimumEvents")
        atLeast(editObject.minimumEvents, 1, "minimumEvents")
        updatedRegion.minimumEvents = editObject.minimumEvents
    }
    if("minimumUniqueEvents" in editObject){
        numCheck(editObject.minimumUniqueEvents, "minimumUniqueEvents")
        intCheck(editObject.minimumUniqueEvents, "minimumUniqueEvents")
        atLeast(editObject.minimumUniqueEvents, 1, "minimumUniqueEvents")
        updatedRegion.minimumUniqueEvents = editObject.minimumUniqueEvents
    }
    if("minimumEventsInAddrState" in editObject){
        numCheck(editObject.minimumEventsInAddrState, "minimumEventsInAddrState")
        intCheck(editObject.minimumEventsInAddrState, "minimumEventsInAddrState")
        atLeast(editObject.minimumEventsInAddrState, 0, "minimumEventsInAddrState")
        updatedRegion.minimumEventsInAddrState = editObject.minimumEventsInAddrState
    }
    if("onlineAllowed" in editObject){
        booleanCheck(editObject.onlineAllowed, "onlineAllowed")
        updatedRegion.onlineAllowed = editObject.onlineAllowed
    }
    const regionCollection = await regions();
    delete updatedRegion._id;
    const updatedInfo = await regionCollection.findOneAndUpdate(
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