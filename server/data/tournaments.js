import {tournaments} from '../config/mongoCollections.js'
import {ObjectId} from 'mongodb'
import { arrayCheck, atLeast, booleanCheck, intCheck, numCheck, objectCheck, stringCheck } from '../helpers.js'

const createTournament = async (id, tournamentName, addrState, city, country, pfp, banner) => {
    numCheck(id, "tournamentId")
    intCheck(id, "tournamentId")
    tournamentName = stringCheck(tournamentName, "tournamentName")
    if(addrState === null){
        addrState = "N/A"
    }
    if(city === null){
        city = "N/A"
    }
    if(country === null){
        country = "N/A"
    }
    addrState = stringCheck(addrState, "addrState")
    atLeast(addrState, 1, "addrState")
    city = stringCheck(city, "city")
    atLeast(city, 1, "city")
    country = stringCheck(country, "country")
    atLeast(country, 1, "country")
    //add url check
    const tournamentCollection = await tournaments()
    let newTourney = {
        _id: id,
        tournamentName: tournamentName,
        city: city,
        addrState: addrState,
        country: country,
        pfp: pfp,
        banner: banner,
        events: []
    }
    const insertInfo = await tournamentCollection.insertOne(newTourney)
    if (!insertInfo.acknowledged || !insertInfo.insertedId)
        throw 'Could not add tournament'
    const tournament = await getMainTournament(id)
    console.log(tournament)
    return tournament;
}

const getAllTournaments = async () => {
    const theTournaments = await tournaments()
    let tournamentList = await theTournaments.find({}).toArray()
    if (!tournamentList) throw 'Could not get all tournaments'
    return tournamentList
}

const getMainTournament = async (id) => {
    numCheck(id, "tourneyId")
    intCheck(id, "tourneyId")
    const tournamentCollection = await tournaments()
    const findTournament = await tournamentCollection.findOne({_id: id})
    if (findTournament === null) throw `No tournament with that id: ${id}`
    return findTournament
};

const removeTournament = async (id) => {
    numCheck(id, "tourneyId")
    intCheck(id, "tourneyId")
    const tournamentCollection = await tournaments()
    const deletionInfo = await tournamentCollection.findOneAndDelete({
      _id: new ObjectId(id)
    })
    if (!deletionInfo) {
      throw `Could not delete tournament id: ${id}`
    }
    return `${deletionInfo.tournamentName} has been successfully deleted!`
};

const editTournament = async (id, editObject) => {
    numCheck(id, "tourneyId")
    intCheck(id, "tourneyId")
    objectCheck(editObject, "tourneyEditObject")  
    let updatedTournament = await getMainTournament(id)
    if("tournamentName" in editObject){
        editObject.tournamentName = stringCheck(editObject.tournamentName, "tournamentName")
        atLeast(editObject.tournamentName, 1, "tournamentName")
        updatedTournament.tournamentName = editObject.tournamentName
    }
    if("addrState" in editObject){
        editObject.addrState = stringCheck(editObject.addrState, "addrState")
        atLeast(editObject.addrState, 1, "addrState")
        updatedTournament.addrState = editObject.addrState
    }
    if("events" in editObject){
        arrayCheck(editObject.events, "events")
        for (const element of editObject.events) {
            objectCheck(element, "event")
        }
        updatedTournament.events = editObject.events
    }
    const tournamentCollection = await tournaments();
    delete updatedTournament._id;
    const updatedInfo = await tournamentCollection.findOneAndUpdate(
        {_id: id},
        {$set: updatedTournament},
        {returnDocument: 'after'}
      )
    if (!updatedInfo) {
        throw 'could not update tournament successfully'
    }
    updatedInfo._id = updatedInfo._id.toString()
    return updatedInfo
}

const editTournamentName = async (id, newName) => {
    return await editTournament(id, {tournamentName: newName})
}

const editTournamentState = async (id, addrState) => {
    return await editTournament(id, {addrState: addrState})
}

const editTournamentOnline = async (id, isOnline) => {
    return await editTournament(id, {isOnline: isOnline})
}

const editTournamentEvents = async (id, events) => {
    return await editTournament(id, {events: events})
}

const createEvent = async (tournamentId, eventId, eventName, isOnline, videogameId, startAt, entrants) => {
    numCheck(eventId, "eventId")
    intCheck(eventId, "eventId")
    numCheck(videogameId, "videogameId")
    intCheck(videogameId, "videogameId")
    numCheck(startAt, "startAt")
    intCheck(startAt, "startAt")
    numCheck(entrants, "entrants")
    intCheck(entrants, "entrants")
    eventName = stringCheck(eventName, "eventName")
    atLeast(eventName, 1, "eventName")
    if(entrants <= 1){
        throw 'invalid entrants'
    }
    const newEvent = {
        eventId: eventId,
        eventName: eventName,
        isOnline: isOnline,
        videogameId: videogameId,
        startAt: startAt,
        entrants: entrants
    }
    let tournament = await getMainTournament(tournamentId)
    const index = tournament.events.findIndex(event => event.eventId === eventId)
    if(index !== -1){
        throw `event of ${eventId} already exists`
    }
    tournament.events.push(newEvent)
    await editTournamentEvents(tournamentId, tournament.events)
    return newEvent
}

const getAllEvents = async (tournamentId) => {
    const tournament = await getMainTournament(tournamentId)
    return tournament.events
}

const getTournament = async (tournamentId, eventId) => {
    numCheck(tournamentId, "tournamentId")
    intCheck(tournamentId, "tournamentId")
    numCheck(eventId, "eventId")
    intCheck(eventId, "eventId")
    let tournament = await getMainTournament(tournamentId)
    const index = tournament.events.findIndex(event => event.eventId === eventId)
    if(index === -1){
        throw `event of ${eventId} doesnt exist`
    }
    return index
}

const removeEvent = async (tournamentId, eventId) => {
    numCheck(eventId, "eventId")
    intCheck(eventId, "eventId")
    let tournament = await getMainTournament(tournamentId)
    const index = tournament.events.findIndex(event => event.eventId === eventId)
    if(index === -1){
        throw `event of ${eventId} doesnt exist`
    }
    tournament.events.splice(index, 1)
    return tournament.events
}

const editEvent = async (id, eventId, editObject) => {
    id = stringCheck(id, "tourneyId")
    atLeast(id, 1, "tourneyId")
    id = parseInt(id)
    objectCheck(editObject, "tourneyEditObject")  
    let updatedTournament = await getMainTournament(id)
    const index = await getTournament(id, eventId)
    if("eventName" in editObject){
        editObject.eventName = stringCheck(editObject.tournamentName, "eventName")
        atLeast(editObject.eventName, 1, "eventName")
        updatedTournament.events[index].eventName = editObject.eventName
    }
    if("entrants" in editObject){
        numCheck(editObject.entrants, "entrants")
        intCheck(editObject.entrants, "entrants")
        if(editObject.entrants <= 1){
            throw 'invalid entrant amount'
        }
        updatedTournament.events[index].entrants = editObject.entrants
    }
    if("isOnline" in editObject){
        booleanCheck(editObject.isOnline, "isOnline")
        updatedTournamente.events[index].isOnline = editObject.isOnline
    }
    if("videogameId" in editObject){
        numCheck(editObject.videogameId, "videogameId")
        intCheck(editObject.videogameId, "videogameId")
        if(editObject.videogameId < 0){
            throw 'invalid videogameId'
        }
        updatedTournament.events[index].videogameId = editObject.videogameId
    }
    if("startAt" in editObject){
        numCheck(editObject.startAt, "startAt")
        intCheck(editObject.startAt, "startAt")
        if(editObject.startAt < 0){
            throw 'invalid startAt'
        }
        updatedTournament.events[index].startAt = editObject.startAt
    }
    await editTournamentEvents(id, updatedTournament.events)
    return updatedTournament.events[index]
}

export{
    createTournament,
    editTournament,
    getMainTournament,
    getAllTournaments,
    removeTournament,
    editTournamentName,
    editTournamentState,
    editTournamentEvents,
    editTournamentOnline,
    createEvent,
    getAllEvents,
    getTournament,
    removeEvent,
    editEvent
}