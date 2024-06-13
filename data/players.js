import { players, regions } from '../config/mongoCollections.js'
import { arrayCheck, atLeast, doRequest, idCheck, intCheck, numCheck, objectCheck, stringCheck } from '../helpers.js'
import { editRegion, getRegion } from './regions.js'
import { getTournament } from './tournaments.js'


//data functions for players collection
const createPlayer = async (playerId) => {
    numCheck(playerId, "playerId")
    intCheck(playerId, "playerId")
    const query = `
    query Name($id: ID!) {
        player(id: $id) {
            gamerTag
        }
    }
    `
    const data = await doRequest(query, playerId, 0, 0, 0, 0)
    let newPlayer = {
        _id: playerId,
        gamerTag: data.data.player.gamerTag,
        games: []
    }
    const playerCollection = await players()
    const insertInfo = await playerCollection.insertOne(newPlayer)
    if (!insertInfo.acknowledged || !insertInfo.insertedId)
        throw 'Could not add region'
    const newId = insertInfo.insertedId.toString()
    const player = await getPlayer(newId)
    return player;
}

const getAllPlayers = async () => {
    const players = await players()
    let playerList = await players.find({}).toArray()
    if (!playerList) throw 'Could not get all region'
    return playerList
}

const getPlayer = async (id) => {
    let x = new ObjectId()
    id = idCheck(id, "playerId")
    const playerCollection = await players()
    const findPlayer = await playerCollection.findOne({_id: new ObjectId(id)})
    if (findPlayer === null) throw `No region with that id: ${id}`
    findPlayer._id = findPlayer._id.toString();
    return findPlayer
};

const removePlayer = async (id) => {
    id = idCheck(id, "playerId")
    const playerCollection = await players()
    const regionCollection = await regions();
    const deletionInfo = await playerCollection.findOneAndDelete({
      _id: new ObjectId(id)
    })
    if (!deletionInfo) {
      throw `Could not delete region id: ${id}`
    }
    const deletionInfo2 = await regionCollection.updateMany(
        { "seasons.players": id },
        { $pull: { "seasons.$[].players": id } }
    );
    if (!deletionInfo2) {
        throw `Could not delete region id: ${id}`
      }
    return `${deletionInfo.value.gamerTag} has been successfully deleted!`
};

const editPlayer = async (id, editObject) => {
    id = stringCheck(id, "playerId")
    atLeast(id, 1, "playerId")
    id = parseInt(id)
    objectCheck(editObject, "playerEditObject")  
    let updatedPlayer = await getPlayer(id)
    if("gamerTag" in editObject){
        editObject.gamerTag = stringCheck(editObject.gamerTag, "gamerTag")
        atLeast(editObject.gamerTag, 1, "gamerTag")
        updatedPlayer.gamerTag = editObject.gamerTag
    }
    if("games" in editObject){
        arrayCheck(editObject.games, "games")
        for (const element of editObject.games) {
            objectCheck(element, "game")
        }
        updatedPlayer.games = editObject.games
    }
    const playerCollection = await players();
    delete updatedPlayer._id;
    const updatedInfo = await playerCollection.findOneAndUpdate(
        {_id: id},
        {$set: updatedPlayer},
        {returnDocument: 'after'}
      )
    if (!updatedInfo) {
        throw 'could not update tournament successfully'
    }
    updatedInfo._id = updatedInfo._id.toString()
    return updatedInfo
}

//data functions for games of user
const createGameForPlayer = async (id, gameId) => {
    id = idCheck(id, "playerId")
    numCheck(gameId, 'gameId')
    intCheck(gameId, 'gameId')
    let player = await getPlayer(id)
    const query = `
    query videogameCheck($id: ID!) {
        videogame(id: $id) {
            name
        }
    }
    `
    const data = await doRequest(query, gameId, 0, 0, 0, 0)
    if(data.data.player.name){
        newGame = {
            gameId: gameId,
            tournaments: [],
            wins: [],
            losses: []
        }
        player.games.push(newGame)
        player = await editPlayer(id, player)
        return newGame
    }
    else{
        throw 'invalid gameId'
    }
}

const getAllGamesForPlayer = async (id) => {
    id = idCheck(id, "playerId")
    const player = await getPlayer(id)
    return player.games
}

const getGameFromPlayer = async (id, gameId) => {
    id = idCheck(id, "playerId")
    numCheck(id, "gameId")
    intCheck(id, "gameId")
    const player = await getPlayer(id)
    const index = player.games.findIndex(game => game.gameId === gameId)
    if(index === -1){
        throw `game of ${gameId} does not exist`
    }
    return index
}

const removeGameFromPlayer = async (id, gameId) => {
    id = idCheck(id, "playerId")
    numCheck(id, "gameId")
    intCheck(id, "gameId")
    let player = await getPlayer(id)
    const index = player.games.findIndex(game => game.gameId === gameId)
    if(index === -1){
        throw `game of ${gameId} does not exist`
    }
    player.games.splice(index, 1)
    await editPlayer(id, player)
    return player.games
}

const editGameForPlayer = async (id, gameId, editObject) => {
    id = idCheck(id, "playerId")
    numCheck(id, "gameId")
    intCheck(id, "gameId")
    let player = await getPlayer(id)
    const index = player.games.findIndex(game => game.gameId === gameId)
    if(index === -1){
        throw `game of ${gameId} does not exist`
    }
    if('tournaments' in editObject){
        arrayCheck(editObject.tournaments, "games")
        for (const element of editObject.tournaments) {
            objectCheck(element, "tournament")
        }
        player.games[index].tournaments = editObject.tournaments
    }
    if('wins' in editObject){
        arrayCheck(editObject.wins, "wins")
        for (const element of editObject.wins) {
            objectCheck(element, "win")
        }
        player.games[index].wins = editObject.wins
    }
    if('losses' in editObject){
        arrayCheck(editObject.losses, "games")
        for (const element of editObject.losses) {
            objectCheck(element, "loss")
        }
        player.games[index].losses = editObject.losses
    }
    await editPlayer(id, player)
    return player.games[index]
} 

//data functions for tournaments of game
const createTournamentForPlayer = async (id, gameId, tournamentId, eventId, placement) => {
    id = idCheck(id, "playerId")
    numCheck(gameId, 'gameId')
    intCheck(gameId, 'gameId')
    tournamentId = idCheck(tournamentId, 'tournamentId')
    numCheck(eventId, 'eventId')
    intCheck(eventId, 'eventId')
    numCheck(placement, 'placement')
    intCheck(placement, 'placement')
    if(placement <= 0){
        throw 'invalid placement'
    }
    let player = await getPlayer(id)
    const gameIndex = await getGameFromPlayer(id, gameId)
    await getTournament(tournamentId, eventId)
    newTournament = {
        tournamentId: tournamentId,
        eventId: eventId,
        placement: placement
    }
    player.games[gameIndex].tournaments.push(newTournament)
    player = await editPlayer(id, player)
    return newTournament
}

const getAllTournamentsForPlayer = async (id, gameId) => {
    id = idCheck(id, "playerId")
    numCheck(gameId, 'gameId')
    intCheck(gameId, 'gameId')
    const player = await getPlayer(id)
    const gameIndex = await getGameFromPlayer(id, gameId)
    return player.games[gameIndex].tournaments
}

const getTournamentFromPlayer = async (id, gameId, tournamentId, eventId) => {
    id = idCheck(id, "playerId")
    numCheck(gameId, 'gameId')
    intCheck(gameId, 'gameId')
    tournamentId = idCheck(tournamentId, 'tournamentId')
    numCheck(eventId, 'eventId')
    intCheck(eventId, 'eventId')
    const player = await getPlayer(id)
    const gameIndex = await getGameFromPlayer(id, gameId)
    const index = player.games[gameIndex].tournaments.findIndex(tournament => tournament.eventId === eventId && tournament.tournamentId === tournamentId)
    if(index === -1){
        throw `game of ${gameId} does not exist`
    }
    return index
}

const removeTournamentFromPlayer = async (id, gameId, tournamentId, eventId) => {
    let player = await getPlayer(id)
    const gameIndex = await getGameFromPlayer(id, gameId)
    const index = await getTournamentFromPlayer(id, gameId, tournamentId, eventId)
    player.games[gameIndex].tournaments.splice(index, 1)
    await editPlayer(id, player)
    return player.games[gameIndex].tournaments
}

const editTournamentForPlayer = async (id, gameId, tournamentId, eventId, editObject) => {
    let player = await getPlayer(id)
    const gameIndex = await getGameFromPlayer(id, gameId)
    const index = await getTournamentFromPlayer(id, gameId, tournamentId, eventId)
    if('placement' in editObject){
        numCheck(editObject.placement, "placement")
        intCheck(editObject.placement, "placement")
        if(editObject.placement <= 0){
            throw 'invalid placement'
        }
        player.games[gameIndex].tournaments[index].placement = editObject.placement
    }
    await editPlayer(id, player)
    return player.games[gameIndex].tournaments[index]
} 

//data functions for wins of game
const validateOpponentAndSetId = (opponentId, setId) => {
    numCheck(opponentId, "opponentId");
    intCheck(opponentId, "opponentId");
    numCheck(setId, "setId");
    intCheck(setId, "setId");
};

const createPlayerRecord = async (type, playerId, gameId, tourneyId, eventId, opponentName, opponentId, setId) => {
    if(type !== 'wins' && type != 'losses'){
        throw 'invalid type'
    }
    validateOpponentAndSetId(opponentId, setId);
    opponentName = stringCheck(opponentName, "opponentName");
    atLeast(opponentName, 1, "opponentName");
    let player = await getPlayer(playerId)
    const gameIndex = await getGameFromPlayer(id, gameId)
    await getTournament(tourneyId, eventId);
    const records = player.game[gameIndex][type];
    const recordIndex = records.findIndex(record => record.opponentId === opponentId);
    if (recordIndex !== -1) {
        throw `${type.slice(0, -1)} with id ${opponentId} already exists`;
    }
    const newRecord = {
        opponentId: opponentId,
        opponentName: opponentName,
        tournaments: [{ setId: setId, tourneyId: tourneyId, eventId: eventId }]
    };
    records.push(newRecord);
    await editPlayer(playerId, player);
    return newRecord;
};

const getAllRecordsForPlayer = async (type, id, gameId) => {
    if(type !== 'wins' && type !== 'losses'){
        throw 'invalid type'
    }
    id = idCheck(id, "playerId")
    numCheck(gameId, 'gameId')
    intCheck(gameId, 'gameId')
    const player = await getPlayer(id)
    const gameIndex = await getGameFromPlayer(id, gameId)
    return player.games[gameIndex][type]
}

const getRecordFromPlayer = async (type, id, gameId, opponentId) => {
    if(type !== 'wins' && type != 'losses'){
        throw 'invalid type'
    }
    id = idCheck(id, "playerId")
    numCheck(gameId, 'gameId')
    intCheck(gameId, 'gameId')
    numCheck(opponentId, 'eventId')
    intCheck(opponentId, 'eventId')
    const player = await getPlayer(id)
    const gameIndex = await getGameFromPlayer(id, gameId)
    const index = player.games[gameIndex][type].findIndex(record => record.opponentId === opponentId)
    if(index === -1){
        throw `${type} of ${opponentId} does not exist`
    }
    return index
}

const removeRecordFromPlayer = async (type, id, gameId, opponentId) => {
    if(type !== 'wins' && type != 'losses'){
        throw 'invalid type'
    }
    let player = await getPlayer(id)
    const gameIndex = await getGameFromPlayer(id, gameId)
    const index = await getRecordFromPlayer(id, gameId, opponentId)
    player.games[gameIndex][type].splice(index, 1)
    await editPlayer(id, player)
    return player.games[gameIndex][type]
}

const editRecordForPlayer = async (type, id, gameId, opponentId, editObject) => {
    if(type !== 'wins' && type != 'losses'){
        throw 'invalid type'
    }
    let player = await getPlayer(id)
    const gameIndex = await getGameFromPlayer(id, gameId)
    let records = player.games[gameIndex][type];
    const recordIndex = await getRecordFromPlayer(type, id, gameId, opponentId);
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
    await editPlayer(id, player);
    return records[recordIndex];
} 

const createPlayerWin = async (playerId, gameId, tourneyId, eventId, opponentName, opponentId, setId) => {
    return await createPlayerRecord('wins', playerId, gameId, tourneyId, eventId, opponentName, opponentId, setId);
};

const createPlayerLoss = async (playerId, gameId, tourneyId, eventId, opponentName, opponentId, setId) => {
    return await createPlayerRecord('losses', playerId, gameId, tourneyId, eventId, opponentName, opponentId, setId);
};

const getAllPlayerWins = async (id, gameId) => {
    return await getAllRecordsForPlayer('wins', id, gameId);
};

const getAllPlayerLosses = async (id, gameId) => {
    return await getAllRecordsForPlayer('losses', id, gameId);
};

const getPlayerWin = async (id, gameId, opponentId) => {
    return await getRecordFromPlayer('wins', id, gameId, opponentId);
};

const getPlayerLoss = async (id, gameId, opponentId) => {
    return await getRecordFromPlayer('losses', id, gameId, opponentId);
};

const removePlayerWin = async (id, gameId, opponentId) => {
    return await removeRecordFromPlayer('wins', id, gameId, opponentId);
};

const removePlayerLoss = async (id, gameId, opponentId) => {
    return await removeRecordFromPlayer('losses', id, gameId, opponentId);
};

const editPlayerWin = async (id, gameId, opponentId, editObject) => {
    return await editRecordForPlayer('wins', id, gameId, opponentId, editObject);
};

const editPlayerLoss = async (id, gameId, opponentId, editObject) => {
    return await editRecordForPlayer('losses', id, gameId, opponentId, editObject);
};

//data functions for regions collection

const createPlayerForSeason = async (regionId, seasonName, playerId) => {
    regionId = idCheck(regionId, "regionId")
    seasonName = stringCheck(seasonName, "seasonName")
    atLeast(seasonName, 1, "seasonName")
    numCheck(playerId, "playerId")
    intCheck(playerId, "playerId")
    await getPlayer(playerId)
    let region = await getRegion(regionId)
    let seasonIndex = await getSeason(regionId, seasonName)
    if(region.seasons[seasonIndex].players.findIndex(player => player === playerId) !== -1){
        throw `player with id ${playerId} already exists`
    }
    region.players.push(playerId)
    await editRegion(regionId, region)
    return region
}

const getAllPlayersBySeason = async (regionId, seasonName) => {
    regionId = idCheck(regionId, "regionId")
    seasonName = stringCheck(seasonName, "seasonName")
    atLeast(seasonName, 1, "seasonName")
    const region = await getRegion(regionId)
    const seasonIndex = await getSeason(regionId, seasonName)
    return region.seasons[seasonIndex].players
}

const getPlayerFromSeason = async (regionId, seasonName, playerId) => {
    regionId = idCheck(regionId, "regionId")
    seasonName = stringCheck(seasonName, "seasonName")
    atLeast(seasonName, 1, "seasonName")
    numCheck(playerId, "playerId")
    intCheck(playerId, "playerId")
    await getPlayer(playerId)
    const region = await getRegion(regionId)
    const seasonIndex = await getSeason(regionId, seasonName)
    const index = region.seasons[seasonIndex].players.findIndex(player => player === playerId)
    if(index === -1){
        throw `player of ${playerId} does not exist`
    }
    return index
}

const removePlayerFromSeason = async (regionId, seasonName, playerId) => {
    regionId = idCheck(regionId, "regionId")
    seasonName = stringCheck(seasonName, "seasonName")
    atLeast(seasonName, 1, "seasonName")
    numCheck(playerId, "playerId")
    intCheck(playerId, "playerId")
    let region = await getRegion(regionId)
    const seasonIndex = await getSeason(regionId, seasonName)
    const index = region.seasons[seasonIndex].players.findIndex(player => player === playerId)
    if(index === -1){
        throw `player of ${playerId} does not exist`
    }
    region.seasons[seasonIndex].players.splice(index, 1)
    await editRegion(regionId, region)
    return region.seasons[seasonIndex].players
}

const filterPlayers = async (regionId, seasonName, playerIds) => {
    regionId = idCheck(regionId, "regionId")
    seasonName = stringCheck(seasonName, "seasonName")
    atLeast(seasonName, 1, "seasonName")
    arrayCheck(playerIds, "tourneyIds")
    for(const id of playerIds){
        numCheck(id, "playerId")
        intCheck(id, "playerId")
        await getPlayer(id)
    }
    let region = await getRegion(regionId)
    const seasonIndex = await getSeason(regionId, seasonName)
    region.seasons[seasonIndex].players = region.seasons[seasonIndex].players.filter(player => !playerIds.includes(player))  
    return region
}

export{
    createPlayer,
    getAllPlayers,
    getPlayer,
    removePlayer,
    editPlayer,
    createGameForPlayer,
    getAllGamesForPlayer,
    getGameFromPlayer,
    removeGameFromPlayer,
    editGameForPlayer,
    createTournamentForPlayer,
    getAllTournamentsForPlayer,
    getTournamentFromPlayer,
    removeTournamentFromPlayer,
    editTournamentForPlayer,
    createPlayerWin,
    createPlayerLoss,
    getAllPlayerWins,
    getAllPlayerLosses,
    getPlayerWin,
    getPlayerLoss,
    removePlayerWin,
    removePlayerLoss,
    editPlayerWin,
    editPlayerLoss,
    createPlayerForSeason,
    getAllPlayersBySeason,
    getPlayerFromSeason,
    removePlayerFromSeason,
    filterPlayers
}