import {tournaments} from '../config/mongoCollections.js'
import {ObjectId} from 'mongodb'
import { arrayCheck, atLeast, booleanCheck, idCheck, intCheck, numCheck, objectCheck, stringCheck } from '../helpers.js'

const createTournament = async (id, tournamentName, entrants, addrState) => {
    tournamentName = stringCheck(tournamentName, "tournamentName")
    numCheck(entrants, "entrants")
    intCheck(entrants, "entrants")
    addrState = stringCheck(addrState, "addrState")
    atLeast(addrState, 1, "addrState")
    const tournamentCollection = await tournaments()
    let newTourney = {
        _id: id,
        tournamentName: tournamentName,
        entrants: entrants,
        addrState: addrState,
        eligible: []
    }
    const insertInfo = await tournamentCollection.insertOne(newTourney)
    if (!insertInfo.acknowledged || !insertInfo.insertedId)
        throw 'Could not add tournament'
    const tournament = await getTournament(id)
    console.log(tournament)
    return tournament;
}

const getAllTournaments = async () => {
    const tournaments = await tournaments()
    let tournamentList = await tournaments.find({}).toArray()
    if (!tournamentList) throw 'Could not get all tournaments'
    return tournamentList
}

const getTournament = async (id) => {
    numCheck(id, "tourneyId")
    intCheck(id, "tourneyId")
    const tournamentCollection = await tournaments()
    const findTournament = await tournamentCollection.findOne({_id: id})
    if (findTournament === null) throw `No tournament with that id: ${id}`
    findTournament._id = findTournament._id.toString();
    return findTournament
};

const removeTournament = async (id) => {
    id = idCheck(id, "tourneyId")
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
    id = stringCheck(id, "tourneyId")
    atLeast(id, 1, "tourneyId")
    id = parseInt(id)
    objectCheck(editObject, "tourneyEditObject")  
    let updatedTournament = await getTournament(id)
    if("tournamentName" in editObject){
        editObject.tournamentName = stringCheck(editObject.tournamentName, "tournamentName")
        updatedTournament.tournamentName = editObject.tournamentName
    }
    if("entrants" in editObject){
        numCheck(editObject.placement, "entrants")
        intCheck(editObject.placement, "entrants")
        if(placement <= 1){
            throw 'invalid entrant amount'
        }
        updatedTournament.entrants = editObject.entrants
    }
    if("addrState" in editObject){
        editObject.addrState = stringCheck(editObject.addrState, "addrState")
        atLeast(editObject.addrState, 1, "addrState")
        updatedTournament.addrState = editObject.addrState
    }
    if("eligible" in editObject){
        arrayCheck(editObject.eligible, "eligible")
        for (const element of editObject.eligible) {
            objectCheck(element, "eligible")
            console.log(element)
            const keys = Object.keys(element);
            if (keys.length !== 2) {
                throw 'invalid eligible object'
            }
            let value = element[keys[1]];
            booleanCheck(value, "eligibleVal")
            let value2 = element[keys[0]];
            value2 = stringCheck(value2, "regionName")
            atLeast(value2, 1, "regionName")
        }
        updatedTournament.eligible = editObject.eligible
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

const editTournamentEntrants = async (id, entrants) => {
    return await editTournament(id, {entrants: entrants})
}

const editTournamentEligible = async (id, eligible) => {
    return await editTournament(id, {eligible: eligible})
}

const editTournamentState = async (id, addrState) => {
    return await editTournament(id, {addrState: addrState})
}

export{
    createTournament,
    editTournament,
    getTournament,
    getAllTournaments,
    removeTournament,
    editTournamentName,
    editTournamentEntrants,
    editTournamentEligible,
    editTournamentState
}