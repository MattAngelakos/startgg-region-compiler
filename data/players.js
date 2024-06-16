import { players, regions } from '../config/mongoCollections.js'
import { arrayCheck, atLeast, doRequest, idCheck, intCheck, numCheck, objectCheck, stringCheck } from '../helpers.js'
import { editRegion, getRegion } from './regions.js'
import { getTournament } from './tournaments.js'


//data functions for players collection
const createPlayer = async (playerId, opponentName) => {
    numCheck(playerId, "playerId")
    intCheck(playerId, "playerId")
    let gamerTag
    if(opponentName){
        gamerTag = stringCheck(opponentName, "gamerTag")
        atLeast(gamerTag, 1, "gamerTag")
    }
    else{
        const query = `
        query Name($id: ID!) {
            player(id: $id) {
                gamerTag
            }
        }
        `
        const data = await doRequest(query, playerId, 0, 0, 0, 0)
        gamerTag = data.data.player.gamerTag
    }
    let newPlayer = {
        _id: playerId,
        gamerTag: gamerTag,
        games: []
    }
    const playerCollection = await players()
    const insertInfo = await playerCollection.insertOne(newPlayer)
    if (!insertInfo.acknowledged || !insertInfo.insertedId)
        throw 'Could not add region'
    const newId = insertInfo.insertedId
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
    numCheck(id, "playerId")
    intCheck(id, "playerId")
    const playerCollection = await players()
    const findPlayer = await playerCollection.findOne({_id: id})
    if (findPlayer === null) throw `No region with that id: ${id}`
    findPlayer._id = findPlayer._id.toString();
    return findPlayer
};

const removePlayer = async (id) => {
    numCheck(id, "playerId")
    intCheck(id, "playerId")
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
    numCheck(id, "playerId")
    intCheck(id, "playerId")
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
    numCheck(id, 'gameId')
    intCheck(id, 'gameId')   
    numCheck(gameId, 'gameId')
    intCheck(gameId, 'gameId')
    let player = await getPlayer(id)
    // const query = `
    // query videogameCheck($id: ID!) {
    //     videogame(id: $id) {
    //         name
    //     }
    // }
    // `
    // const data = await doRequest(query, gameId, 0, 0, 0, 0)
    // if(data.data.videogame.name){
    if(true){
        const query2 = `
        query Name($id: ID!, $videogameId: ID!) {
            player(id: $id) {
                gamerTag
                rankings(videogameId: $videogameId) {
                    rank
                    title
                }
            }
        }
        `
        const rankings = await doRequest(query2, id, gameId, 0, 0, 0)
        let gameRanks
        if(rankings.data.player.rankings === null){
            gameRanks = []
        }else{
            gameRanks = rankings.data.player.rankings
        }
        const newGame = {
            gameId: gameId,
            tournaments: [],
            opponents: [],
            characters: [],
            rankings: gameRanks,
            lastRecordedSet: {}
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
    numCheck(playerId, "playerId")
    intCheck(playerId, "playerId")
    const player = await getPlayer(id)
    return player.games
}

const getGameFromPlayer = async (id, gameId) => {
    numCheck(id, "playerId")
    intCheck(id, "playerId")
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
    numCheck(id, "playerId")
    intCheck(id, "playerId")
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
    numCheck(id, "playerId")
    intCheck(id, "playerId")
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
    if('opponents' in editObject){
        arrayCheck(editObject.opponents, "opponents")
        for (const element of editObject.opponents) {
            objectCheck(element, "opponent")
        }
        player.games[index].opponents = editObject.opponents
    }
    if('characters' in editObject){
        arrayCheck(editObject.characters, "characters")
        for (const element of editObject.characters) {
            objectCheck(element, "character")
        }
        player.games[index].characters = editObject.characters
    }
    if('rankings' in editObject){
        arrayCheck(editObject.rankings, "rankings")
        for (const element of editObject.rankings) {
            objectCheck(element, "rank")
        }
        player.games[index].rankings = editObject.rankings
    }
    if("lastRecordedSet" in editObject){
        objectCheck(editObject.lastRecordedSet, "lastRecordedSet")
        player.games[index].lastRecordedSet = editObject.lastRecordedSet
    }
    await editPlayer(id, player)
    return player.games[index]
} 

//data functions for tournaments of game
const createTournamentForPlayer = async (id, gameId, tournamentId, eventId, placement) => {
    numCheck(id, "playerId")
    intCheck(id, "playerId")
    numCheck(gameId, 'gameId')
    intCheck(gameId, 'gameId')
    numCheck(tournamentId, "tournamentId")
    intCheck(tournamentId, "tournamentId")
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
    const newTournament = {
        tournamentId: tournamentId,
        eventId: eventId,
        placement: placement
    }
    player.games[gameIndex].tournaments.push(newTournament)
    player = await editPlayer(id, player)
    return newTournament
}

const getAllTournamentsForPlayer = async (id, gameId) => {
    numCheck(id, "playerId")
    intCheck(id, "playerId")
    numCheck(gameId, 'gameId')
    intCheck(gameId, 'gameId')
    const player = await getPlayer(id)
    const gameIndex = await getGameFromPlayer(id, gameId)
    return player.games[gameIndex].tournaments
}

const getTournamentFromPlayer = async (id, gameId, tournamentId, eventId) => {
    numCheck(id, "playerId")
    intCheck(id, "playerId")
    numCheck(gameId, 'gameId')
    intCheck(gameId, 'gameId')
    numCheck(tournamentId, "tournamentId")
    intCheck(tournamentId, "tournamentId")
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
    if(type !== 'win' && type != 'loss'){
        throw 'invalid type'
    }
    validateOpponentAndSetId(opponentId, setId);
    opponentName = stringCheck(opponentName, "opponentName");
    atLeast(opponentName, 1, "opponentName");
    let player = await getPlayer(playerId)
    const gameIndex = await getGameFromPlayer(playerId, gameId)
    await getTournament(tourneyId, eventId);
    const records = player.games[gameIndex].opponents;
    const recordIndex = records.findIndex(record => record.opponentId === opponentId);
    if (recordIndex !== -1) {
        throw `${type} with id ${opponentId} already exists`;
    }
    const newRecord = {
        opponentId: opponentId,
        opponentName: opponentName,
        tournaments: [{ setId: setId, tournamentId: tourneyId, eventId: eventId, type: type, matches: []}]
    };
    records.push(newRecord);
    await editPlayer(playerId, player);
    return newRecord;
};

const getAllRecordsForPlayer = async (type, id, gameId) => {
    if(type !== 'win' && type !== 'loss'){
        throw 'invalid type'
    }
    numCheck(id, "playerId")
    intCheck(id, "playerId")
    numCheck(gameId, 'gameId')
    intCheck(gameId, 'gameId')
    const player = await getPlayer(id)
    const gameIndex = await getGameFromPlayer(id, gameId)
    return player.games[gameIndex].opponents
}

const getRecordFromPlayer = async (type, id, gameId, opponentId) => {
    if(type !== 'win' && type != 'loss'){
        throw 'invalid type'
    }
    numCheck(id, "playerId")
    intCheck(id, "playerId")
    numCheck(gameId, 'gameId')
    intCheck(gameId, 'gameId')
    numCheck(opponentId, 'eventId')
    intCheck(opponentId, 'eventId')
    const player = await getPlayer(id)
    const gameIndex = await getGameFromPlayer(id, gameId)
    const index = player.games[gameIndex].opponents.findIndex(record => record.opponentId === opponentId)
    if(index === -1){
        throw `${type} of ${opponentId} does not exist`
    }
    return index
}

const removeRecordFromPlayer = async (type, id, gameId, opponentId) => {
    if(type !== 'win' && type != 'loss'){
        throw 'invalid type'
    }
    let player = await getPlayer(id)
    const gameIndex = await getGameFromPlayer(id, gameId)
    const index = await getRecordFromPlayer(id, gameId, opponentId)
    player.games[gameIndex].opponents.splice(index, 1)
    await editPlayer(id, player)
    return player.games[gameIndex].opponents
}

const editRecordForPlayer = async (type, id, gameId, opponentId, editObject) => {
    if(type !== 'win' && type != 'loss'){
        throw 'invalid type'
    }
    let player = await getPlayer(id)
    const gameIndex = await getGameFromPlayer(id, gameId)
    let records = player.games[gameIndex].opponents;
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

const createPlayerMatch = async (playerId, gameId, opponentId, setId, type, playerChar, opponentChar, matchNum, stage) => {
    if(type !== 'win' && type != 'loss'){
        throw 'invalid type'
    }
    playerChar = stringCheck(playerChar, "playerChar");
    atLeast(playerChar, 1, "playerChar");
    opponentChar = stringCheck(opponentChar, "opponentChar");
    atLeast(opponentChar, 1, "opponentChar");
    stage = stringCheck(stage, "stage");
    atLeast(stage, 1, "stage");
    numCheck(matchNum, "matchNum")
    intCheck(matchNum, "matchNum")
    if(matchNum <= 0){
        throw 'invalid matchNum'
    }
    const player = await getPlayer(playerId)
    const gameIndex = await getGameFromPlayer(playerId, gameId)
    const opponentIndex = await getRecordFromPlayer(type, playerId, gameId, opponentId)
    const index = player.games[gameIndex].opponents[opponentIndex].tournaments.findIndex(set => set.setId === setId)
    if(index === -1){
        throw `${setId} of ${opponentId} does not exist`
    }
    const matchIndex = player.games[gameIndex].opponents[opponentIndex].tournaments[index].matches.findIndex(match => match.matchNum === matchNum)
    if(matchIndex !== -1){
        throw `${matchNum} of ${setId} does exist`
    }
    const match = {
        playerChar: playerChar,
        opponentChar: opponentChar,
        stage: stage,
        type: type,
        matchNum: matchNum
    }
    player.games[gameIndex].opponents[opponentIndex].tournaments[index].matches.push(match)
    await editPlayer(playerId, player)
    return match
}

const getMatchFromPlayer = async (playerId, gameId, opponentId, setId, matchNum) => {
    const matches = await getAllMatchesForPlayer(playerId, gameId, opponentId, setId)
    const index = matches.findIndex(match => match.matchNum === matchNum)
    if(index !== -1){
        throw `${matchNum} of ${setId} does exist`
    }
    return index
}

const getAllMatchesForPlayer = async (playerId, gameId, opponentId, setId) => {
    const player = await getPlayer(playerId)
    const gameIndex = await getGameFromPlayer(playerId, gameId)
    const opponentIndex = await getRecordFromPlayer(type, playerId, gameId, opponentId)
    const index = player.games[gameIndex].opponents[opponentIndex].tournaments.findIndex(set => set.setId === setId)
    return player.games[gameIndex].opponents[opponentIndex].tournaments[index].matches
}

const removeMatchFromPlayer = async (playerId, gameId, opponentId, setId, matchNum) => {
    const player = await getPlayer(playerId)
    const gameIndex = await getGameFromPlayer(playerId, gameId)
    const opponentIndex = await getRecordFromPlayer(type, playerId, gameId, opponentId)
    const setIndex = player.games[gameIndex].opponents[opponentIndex].tournaments.findIndex(set => set.setId === setId)
    const index = await getMatchFromPlayer(playerId, gameId, opponentId, setId, matchNum)
    player.games[gameIndex].opponents[opponentIndex].tournaments[setIndex].matches.splice(index, 1)
    await editPlayer(playerId, player)
    return player.games[gameIndex].opponents[opponentIndex].tournaments[setIndex].matches
}

const editMatches = async (playerId, gameId, opponentId, setId, matchNum, editObject) => {
    const player = await getPlayer(playerId)
    const gameIndex = await getGameFromPlayer(playerId, gameId)
    const opponentIndex = await getRecordFromPlayer(type, playerId, gameId, opponentId)
    const setIndex = player.games[gameIndex].opponents[opponentIndex].tournaments.findIndex(set => set.setId === setId)
    const index = await getMatchFromPlayer(playerId, gameId, opponentId, setId, matchNum)
    if('playerChar' in editObject){
        editObject.playerChar = stringCheck(editObject.playerChar, "playerChar");
        atLeast(editObject.playerChar, 1, "playerChar");
        player.games[gameIndex].opponents[opponentIndex].tournaments[setIndex].matches[index].playerChar = editObject.playerChar
    }
    if('opponentChar' in editObject){
        editObject.opponentChar = stringCheck(editObject.opponentChar, "opponentChar");
        atLeast(editObject.opponentChar, 1, "opponentChar");
        player.games[gameIndex].opponents[opponentIndex].tournaments[setIndex].matches[index].opponentChar = editObject.opponentChar   
    }
    if('stage' in editObject){
        editObject.stage = stringCheck(editObject.stage, "stage");
        atLeast(editObject.stage, 1, "stage");
        player.games[gameIndex].opponents[opponentIndex].tournaments[setIndex].matches[index].stage = editObject.stage   
    }
    if('type' in editObject){
        editObject.type = stringCheck(editObject.type, "type");
        atLeast(editObject.type, 1, "type");
        editObject.type = editObject.type.toLowerCase()
        if(editObject.type !== 'win' && editObject.type != 'loss'){
            throw 'invalid type'
        }
        player.games[gameIndex].opponents[opponentIndex].tournaments[setIndex].matches[index].type = editObject.type 
    }
    await editPlayer(playerId, player)
    return player.games[gameIndex].opponents[opponentIndex].tournaments[setIndex].matches[index]
}

const createPlayerWin = async (playerId, gameId, tourneyId, eventId, opponentName, opponentId, setId) => {
    return await createPlayerRecord('win', playerId, gameId, tourneyId, eventId, opponentName, opponentId, setId);
};

const createPlayerLoss = async (playerId, gameId, tourneyId, eventId, opponentName, opponentId, setId) => {
    return await createPlayerRecord('loss', playerId, gameId, tourneyId, eventId, opponentName, opponentId, setId);
};

const getAllPlayerWins = async (id, gameId) => {
    return await getAllRecordsForPlayer('win', id, gameId);
};

const getAllPlayerLosses = async (id, gameId) => {
    return await getAllRecordsForPlayer('loss', id, gameId);
};

const getPlayerWin = async (id, gameId, opponentId) => {
    return await getRecordFromPlayer('win', id, gameId, opponentId);
};

const getPlayerLoss = async (id, gameId, opponentId) => {
    return await getRecordFromPlayer('loss', id, gameId, opponentId);
};

const removePlayerWin = async (id, gameId, opponentId) => {
    return await removeRecordFromPlayer('win', id, gameId, opponentId);
};

const removePlayerLoss = async (id, gameId, opponentId) => {
    return await removeRecordFromPlayer('loss', id, gameId, opponentId);
};

const editPlayerWin = async (id, gameId, opponentId, editObject) => {
    return await editRecordForPlayer('win', id, gameId, opponentId, editObject);
};

const editPlayerLoss = async (id, gameId, opponentId, editObject) => {
    return await editRecordForPlayer('loss', id, gameId, opponentId, editObject);
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
    filterPlayers,
    createPlayerMatch,
    getMatchFromPlayer,
    getAllMatchesForPlayer,
    removeMatchFromPlayer,
    editMatches
}