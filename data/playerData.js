import { atLeast, doRequest, intCheck, numCheck, stringCheck, objectCheck, arrayCheck, sortLev } from "../helpers.js"
import { addPlay, createPlayerCharacter } from "./characters.js"
import { createGameForPlayer, createPlayer, createPlayerLoss, createPlayerMatch, createPlayerWin, createTournamentForPlayer, editPlayer, editPlayerLoss, editPlayerWin, getAllPlayers, getGameFromPlayer, getPlayer, getPlayerLoss, getPlayerWin, getTournamentFromPlayer } from "./players.js"
import { getRegion } from "./regions.js"
import { getSeason } from "./seasons.js"
import { createEvent, createTournament, getMainTournament, getTournament } from "./tournaments.js"

const createNewTournament = async (eventId, placement, playerId) => {
    const query = `query Event($id: ID!) {
        event(id: $id) {
          startAt
          type
          name
          tournament {
            name
            addrState
            id
          }
          isOnline
          videogame{
            id
          }
          numEntrants
        }
      }`
    const response = await doRequest(query, eventId, 0, 0, 0, 0)
    const data = response.data
    let event = data.event
    let tournament
    try{
        tournament = await getMainTournament(event.tournament.id)
    }catch(e){
        tournament = await createTournament(event.tournament.id, event.tournament.name, event.tournament.addrState)
    }
    let foundEvent
    try{
        foundEvent = await getTournament(tournament._id, eventId)
    }
    catch(e){
        foundEvent = await createEvent(tournament._id, eventId, event.name, event.isOnline, event.videogame.id, event.startAt, event.numEntrants)
    }
    const newTournament = await createTournamentForPlayer(playerId, foundEvent.videogameId, tournament._id, eventId, placement)
    return newTournament
}

const setsRequest = async (playerId, videogameId) => {
    let player = await getPlayer(playerId)
    const gameIndex = await getGameFromPlayer(playerId, videogameId)
    let page = 1
    let sets = []
    let setsLen = []
    let i = true
    let newLastRecordedSet
    do{
        const query = `
        query Sets($id: ID!, $limit: Int!, $page: Int!) {
            player(id: $id) {
                sets(perPage: $limit, page: $page) {
                    nodes {
                        slots {
                            entrant {
                                id
                                standing{
                                    placement
                                }
                                participants {
                                    gamerTag
                                    player{
                                        id
                                    }
                                }
                            }
                        }
                        games{
                            winnerId
                            stage{
                                name
                            }
                            selections{
                              entrant {
                                  id
                              }
                              character{
                                name
                              }
                            }
                        }
                        id
                        winnerId
                        displayScore
                        completedAt
                        event {
                            id
                            type
                            name
                            videogame{
                                id
                            }
                            tournament {
                                id
                            }
                        }
                    }
                }
            }
        }
        `;
        const response = await doRequest(query, playerId, videogameId, 20, 0, page)
        const data = response.data
        setsLen = data.player.sets.nodes
        sets = data.player.sets.nodes
        let placement, tournament, entrantId
        sets = sets.filter(set => set.event !== null);
        sets = sets.filter(set => set.event.type === 1)
        sets = sets.filter(set => set.displayScore !== "DQ")
        sets = sets.filter(set => set.event.videogame.id === videogameId)
        sets = sets.filter(set => !((set.event.name.toLowerCase()).includes('squad strike')))
        let opponentId, opponentName, winIndex, lossIndex, participant, won
        for(const set of sets){
            try{
                player = await getPlayer(playerId)
                if(set === player.games[gameIndex].lastRecordedSet){
                    return 
                }
                if(i){
                    newLastRecordedSet = set
                    i = false
                }
                for (const slot of set.slots) {
                    participant = slot.entrant.participants[0];
                    if (participant.player.id !== playerId) {
                        opponentName = participant.gamerTag,
                        opponentId = participant.player.id
                        if(slot.entrant.id === set.winnerId){
                            won = false
                        }
                        else{
                            won = true
                        }
                    }
                    else{
                        entrantId = slot.entrant.id
                        placement = slot.entrant.standing.placement
                    }
                }
                let opponent
                try{
                    opponent = await getPlayer(opponentId)
                }catch(e){
                    opponent = await createPlayer(opponentId, opponentName)
                }
                try{
                    await getGameFromPlayer(opponentId, videogameId)
                }catch(e){
                    await createGameForPlayer(opponentId, videogameId)
                }
                try{
                    tournament = await getTournament(set.event.tournament.id, set.event.id)
                }catch(e){
                    tournament = await createNewTournament(set.event.id, placement, playerId)
                }
                try{
                    await getTournamentFromPlayer(playerId, videogameId, set.event.tournament.id, set.event.id)
                }
                catch(e){
                    try{
                        await createTournamentForPlayer(playerId, videogameId, set.event.tournament.id, set.event.id, placement)
                    }catch(e){
                        console.error(e)
                    }
                }
                if(won){
                    try{
                        await createPlayerWin(playerId, videogameId, set.event.tournament.id, set.event.id, opponentName, opponentId, set.id)
                    }
                    catch(e){
                        console.log(e)
                        winIndex = await getPlayerWin(playerId, videogameId, opponentId)
                        const setIndex = player.games[gameIndex].opponents[winIndex].tournaments.findIndex(win => win.setId === set.id)
                        if(setIndex !== -1){
                            throw `win with setId ${setId} already exists`
                        } 
                        player.games[gameIndex].opponents[winIndex].tournaments.push({setId: set.id, tournamentId: set.event.tournament.id, eventId: set.event.id, type: 'win', matches: []})
                        await editPlayerWin(playerId, videogameId, opponentId, {tournaments: player.games[gameIndex].opponents[winIndex].tournaments})
                    }
                }
                else{
                    try{
                        await createPlayerLoss(playerId, videogameId, set.event.tournament.id, set.event.id, opponentName, opponentId, set.id)
                    }
                    catch(e){
                        lossIndex = await getPlayerLoss(playerId, videogameId, opponentId)
                        const setIndex = player.games[gameIndex].opponents[lossIndex].tournaments.findIndex(win => win.setId === set.id)
                        if(setIndex !== -1){
                            throw `loss with setId ${setId} already exists`
                        } 
                        player.games[gameIndex].opponents[lossIndex].tournaments.push({setId: set.id, tournamentId: set.event.tournament.id, eventId: set.event.id, type: 'loss', matches: []})
                        await editPlayerLoss(playerId, videogameId, opponentId, {tournaments: player.games[gameIndex].opponents[lossIndex].tournaments})
                    }
                }
                let playerChar
                let opponentChar
                let stage
                if(set.games){
                    let i = 1
                    for(const game of set.games){
                        if(game.selections){
                            for (const participant of game.selections) {
                                if (participant.entrant.id === entrantId) {
                                    try{
                                        await addPlay(playerId, videogameId, participant.character.name)
                                    }
                                    catch (e){
                                        console.log(e)
                                        await createPlayerCharacter(playerId, videogameId, participant.character.name)
                                    }
                                    playerChar = participant.character.name
                                }
                                else{
                                    opponentChar = participant.character.name
                                }
                            }             
                        }
                        else{
                            playerChar = "N/A"
                            opponentChar = "N/A"
                        }
                        try{
                            stage = game.stage.name
                        }catch(e){
                            stage = "N/A"
                        }
                        if(playerChar === null){
                            playerChar = "N/A"
                        }
                        if(opponentChar === null){
                            opponentChar = "N/A"
                        }
                        if(stage === null){
                            stage = "N/A"
                        }
                        try{
                            if(game.winnerId === entrantId){
                                await createPlayerMatch(playerId, videogameId, opponentId, set.id, 'win', playerChar, opponentChar, i, stage)
                            }
                            else{
                                await createPlayerMatch(playerId, videogameId, opponentId, set.id, 'loss', playerChar, opponentChar, i, stage) 
                            }
                        }catch(e){
                            console.log(e)
                        }
                        i=i+1
                    }
                }
            }
            catch(e){
                console.error(e)
            }
        }
        page = page + 1
        if(page % 15 === 0){
            await new Promise(r => setTimeout(r, 60000));
        }
        await new Promise(r => setTimeout(r, 20000));
    }while(page !== 10)
    player.games[gameIndex].lastRecordedSet = newLastRecordedSet
    await editPlayer(playerId, player)
    return "success"
}

const seasonFilter = async(regionId, seasonName, playerId) => {
    let region = await getRegion(regionId)
    const seasonIndex = await getSeason(regionId, seasonName)
    const index = region.seasons[seasonIndex].players.findIndex(player => player === playerId)
    if(index === -1){
        throw `${playerId} does not exist in season ${seasonName} for region ${regionId}`
    }
    let player = await getPlayer(playerId);
    const videogameIndex = await getGameFromPlayer(playerId, region.gameId);
    const filteredTournaments = await Promise.all(player.games[videogameIndex].tournaments.map(async tournament => {
        const currTournament = await getMainTournament(tournament.tournamentId);
        const eventIndex = await getTournament(tournament.tournamentId, tournament.eventId);
        const isValid = (currTournament.events[eventIndex].startAt >= region.seasons[seasonIndex].startDate) &&
                        (currTournament.events[eventIndex].startAt < region.seasons[seasonIndex].endDate) &&
                        (region.onlineAllowed || !currTournament.events[eventIndex].isOnline) &&
                        (currTournament.events[eventIndex].entrants >= region.minimumEntrants);
                        
        return isValid ? tournament : null;
    }));
    player.games[videogameIndex].tournaments = filteredTournaments.filter(tournament => tournament !== null);
    for (let i = 0; i < player.games[videogameIndex].opponents.length; i++) {
        const record = player.games[videogameIndex].opponents[i];
        const filteredTournaments = await Promise.all(record.tournaments.map(async tournament => {
            const currTournament = await getMainTournament(tournament.tournamentId);
            const eventIndex = await getTournament(tournament.tournamentId, tournament.eventId);
            const isValid = (currTournament.events[eventIndex].startAt >= region.seasons[seasonIndex].startDate) &&
                            (currTournament.events[eventIndex].startAt < region.seasons[seasonIndex].endDate) &&
                            (region.onlineAllowed || !currTournament.events[eventIndex].isOnline) &&
                            (currTournament.events[eventIndex].entrants >= region.minimumEntrants);
            return isValid ? tournament : null;
        }));
        player.games[videogameIndex].opponents[i].tournaments = filteredTournaments.filter(tournament => tournament !== null);
    }
    player.games[videogameIndex].opponents = player.games[videogameIndex].opponents.filter(opponent => opponent.tournaments.length !== 0)
    return player;
}

function reduceEventNames(events) {
    return events.map(event => {
    // Remove anything after a number, '#', or '-'
    let cleanedEvent = event.split(/[#\d-]/)[0].trim();
    // Remove trailing Roman numerals if they occur at the end
    cleanedEvent = cleanedEvent.replace(/(?: [IVXLCDM]+)?$/, '').trim();
    return cleanedEvent;
    });
  }

const playerEligible = async (region, seasonName, playerId) => {
    try {
        const gameIndex = await getGameFromPlayer(playerId, region.gameId);
        const player = await seasonFilter(region._id.toString(), seasonName, playerId);
        if (player.games[gameIndex].tournaments.length < region.minimumEvents) {
            return false;
        }
        if (region.minimumEventsInAddrState > 0) {
            const tournamentsInAddrState = await Promise.all(
                player.games[gameIndex].tournaments.map(async (tournament) => {
                    const tourney = await getMainTournament(tournament.tournamentId);
                    return tourney.addrState === region.addrState;
                })
            );
            if (tournamentsInAddrState.filter(Boolean).length < region.minimumEventsInAddrState) {
                return false;
            }
        }
        if (region.minimumUniqueEvents > 1) {
            const tournamentNames = await Promise.all(
                player.games[gameIndex].tournaments.map(async (tournament) => {
                    const tourney = await getMainTournament(tournament.tournamentId);
                    return tourney.tournamentName;
                })
            );
            const reducedTournamentNames = reduceEventNames(tournamentNames)
            const uniqueEvents = new Set(reducedTournamentNames)
            //console.log(uniqueEvents)
            if (uniqueEvents.length < region.minimumUniqueEvents) {
                return false;
            }
        }
        return true;
    } catch (err) {
        console.error("An error occurred while checking player eligibility:", err);
        return false;
    }
};

const playerFilter = async (regionId, seasonName) => {
    try {
        let region = await getRegion(regionId);
        const seasonIndex = await getSeason(regionId, seasonName);
        let players = region.seasons[seasonIndex].players;
        const eligiblePlayers = [];
        for (const player of players) {
            if (await playerEligible(region, seasonName, player)) {
                eligiblePlayers.push(player);
            }
        }
        return eligiblePlayers;
    } catch (error) {
        console.error("Error in playerFilter:", error);
        throw error;
    }
};


const do_h2h = async (regionId, seasonName) => {
    let opponentIndex
    let h2h = {}
    let region = await getRegion(regionId)
    seasonName = stringCheck(seasonName, "seasonName")
    atLeast(seasonName, 1, "seasonName")
    const seasonIndex = await getSeason(regionId, seasonName)
    let i = 0
    for(const playerId of region.seasons[seasonIndex].players){
        try{
            const player = await seasonFilter(regionId, seasonName, playerId)
            i = i+1
            let newPlayerH2H = {
                id: playerId,
            }
            for (let j = i; j < region.seasons[seasonIndex].players.length; j++) {
                let wins
                let losses
                let opponent
                try{
                    const gameIndex = await getGameFromPlayer(playerId, region.gameId)
                    opponent = await getPlayer(region.seasons[seasonIndex].players[j])
                    opponentIndex = player.games[gameIndex].opponents.findIndex(record => record.opponentId === region.seasons[seasonIndex].players[j])
                    if(opponentIndex === -1){
                        wins = []
                        losses = []
                    }else{
                        wins = player.games[gameIndex].opponents[opponentIndex].tournaments.filter(set => set.type === 'win')
                        losses = player.games[gameIndex].opponents[opponentIndex].tournaments.filter(set => set.type === 'loss')
                    }
                }
                catch(e){
                    wins = []
                    losses = []
                    console.log(e)
                }
                newPlayerH2H[opponent.gamerTag] = {wins: wins.length, losses: losses.length}
            }
            h2h[player.gamerTag] = newPlayerH2H
        }
        catch(e){
            console.error(e)
            console.error(`no season for ${seasonName} ${player.gamerTag}`)
            h2h.forEach(obj => {
                delete obj[player.gamerTag];
            });
            continue
        }
    }
    return h2h
}

const finish_h2h = async (h2h) =>{
    const keys = Object.keys(h2h)
    for(let i = keys.length-1; i >= 0; i--){
        //console.log(`i: ${keys[i]}`)
        const keyI = keys[i];
        for(let j = 0; j < i; j++){
            //console.log(`j: ${keys[j]}`)
            const keyJ = keys[j];
            const temp = h2h[keyJ][keyI];
            h2h[keyI][keyJ] = { wins: temp.losses, losses: temp.wins };
        }
    }
    return h2h
}

const searchForPlayer = async (gamerTag) => {
    stringCheck(gamerTag, "gamerTag")
    const players = await getAllPlayers()
    const result = sortLev(players, gamerTag)
    return result
}

const calcAvgPlacement = async (tournaments, minimumEntrants, maximumEntrants) => {
    let avg = 0
    let numOfBrackets = 0
    arrayCheck(tournaments, "tournaments")
    numCheck(minimumEntrants, "minimumEntrants")
    intCheck(minimumEntrants, "minimumEntrants")
    numCheck(maximumEntrants, "maximumEntrants")
    intCheck(maximumEntrants, "maximumEntrants")
    if(minimumEntrants >= maximumEntrants){
        throw 'invalid range'
    }
    for(const tournament of tournaments){
        objectCheck(tournament, "tournament")
        const currTournament = await getTournament(tournament.tourneyId)
        if(currTournament.entrants >= minimumEntrants && currTournament.entrants <= maximumEntrants){
            avg = avg + tournament.placement
            numOfBrackets = numOfBrackets + 1
        }
    }
    return avg/numOfBrackets
}

const updateName = async (playerId) => {
    const query = `
    query Name($id: ID!) {
        player(id: $id) {
            gamerTag
        }
    }
    `
    numCheck(playerId, "playerId")
    intCheck(playerId, "playerId")
    let player = await getRegion(playerId)
    const data = await doRequest(query, region.players[i].playerId, 0, 0, 0, 0)
    if(data.data.player.gamerTag !== region.players[i].gamerTag){
        player.gamerTag = data.data.player.gamerTag
    }
    await editPlayer(playerId, player)
    return player
}

const updateNames = async (playerIds) => {
    let changes = []
    for(const playerId in playerIds){
        try{
            await updateName(playerId)
            changes.push(`${playerId} updated`)
        }catch(e){
            changes.push(`${playerId} update failed: ${e}`)
        }
    }
    return changes
}

const tournamentFilter = async (playerId, videogameId, eventIds) => {
    for(const eventId of eventIds){
        numCheck(eventId, "eventId")
        intCheck(eventId, "eventId")
    }
    let player = await getPlayer(playerId)
    const videogameIndex = await getGameFromPlayer(playerId, videogameId)
    player.games[videogameIndex].tournaments = player.games[videogameIndex].tournaments.filter(event => !eventIds.includes(event.eventId))
    for(let i = 0; i < player.games[videogameIndex].opponents.length; i++){
        player.games[videogameIndex].opponents[i].tournaments = player.games[videogameIndex].opponents[i].tournaments.filter(event => !eventIds.includes(event.eventId))
    }
    player.games[videogameIndex].opponents = player.games[videogameIndex].opponents.filter(opponent => opponent.tournaments.length !== 0)
    return player
}

const comparePlacements = (tournament1, tournament2, tournamentsData, type) => {
    let val = tournament1.placement - tournament2.placement;
    if (val === 0) {
        const { fullTournament: fullTournament1, eventIndex: index1 } = tournamentsData[tournament1.tournamentId];
        const { fullTournament: fullTournament2, eventIndex: index2 } = tournamentsData[tournament2.tournamentId];
        val = fullTournament2.events[index2].entrants- fullTournament1.events[index1].entrants;
    }
    if(type === -1){
        return -val
    }else{
        return val
    }
};

const comparePercentiles = (tournament1, tournament2, tournamentsData, type) => {
    const { fullTournament: fullTournament1, eventIndex: index1 } = tournamentsData[tournament1.tournamentId];
    const { fullTournament: fullTournament2, eventIndex: index2 } = tournamentsData[tournament2.tournamentId];
    let val = ((fullTournament2.events[index2].entrants - tournament2.placement)/fullTournament2.events[index2].entrants) - ((fullTournament1.events[index1].entrants - tournament1.placement)/fullTournament1.events[index1].entrants);
    if(val === 0){
        fullTournament2.events[index2].entrants- fullTournament1.events[index1].entrants;
    }
    if(type === -1){
        return -val
    }else{
        return val
    }
}

const compareEntrants = (tournament1, tournament2, tournamentsData, type) => {
    const { fullTournament: fullTournament1, eventIndex: index1 } = tournamentsData[tournament1.tournamentId];
    const { fullTournament: fullTournament2, eventIndex: index2 } = tournamentsData[tournament2.tournamentId];
    let val = fullTournament2.events[index2].entrants- fullTournament1.events[index1].entrants;
    if(type === -1){
        return -val
    }else{
        return val
    }
}

const compareDates = (tournament1, tournament2, tournamentsData, type) => {
    const { fullTournament: fullTournament1, eventIndex: index1 } = tournamentsData[tournament1.tournamentId];
    const { fullTournament: fullTournament2, eventIndex: index2 } = tournamentsData[tournament2.tournamentId];
    let val = fullTournament2.events[index2].startedAt - fullTournament1.events[index1].startedAt;
    if(type === -1){
        return -val
    }else{
        return val
    }
}

const compareNames = (tournament1, tournament2, tournamentsData, type) => {
    const { fullTournament: fullTournament1, eventIndex: index1 } = tournamentsData[tournament1.tournamentId];
    const { fullTournament: fullTournament2, eventIndex: index2 } = tournamentsData[tournament2.tournamentId];
    let val = fullTournament1.tournamentName.toLowerCase().localeCompare(fullTournament2.tournamentName.toLowerCase(), undefined, { numeric: true, sensitivity: 'base' });
    if(type === -1){
        return -val
    }else{
        return val
    }
}


const sortTournaments = async (player, videogameId, type) => {
    stringCheck(type, "type");
    atLeast(type, 1, "type");
    const index = await getGameFromPlayer(parseInt(player._id), videogameId);
    const tournamentPromises = player.games[index].tournaments.map(async (tournament) => {
        const fullTournament = await getMainTournament(tournament.tournamentId);
        const eventIndex = await getTournament(tournament.tournamentId, tournament.eventId);
        return { 
            tournamentId: tournament.tournamentId,
            eventId: tournament.eventId,
            fullTournament,
            eventIndex
        };
    });
    const fullTournaments = await Promise.all(tournamentPromises);
    const tournamentsData = fullTournaments.reduce((acc, curr) => {
        acc[curr.tournamentId] = {
            fullTournament: curr.fullTournament,
            eventIndex: curr.eventIndex
        };
        return acc;
    }, {});
    switch (type) {
        case "highestPlacement":
            player.games[index].tournaments.sort((tournament1, tournament2) =>
                comparePlacements(tournament1, tournament2, tournamentsData, 1)
            );
            break;
        case "lowestPlacement":
                player.games[index].tournaments.sort((tournament1, tournament2) =>
                    comparePlacements(tournament1, tournament2, tournamentsData, -1)
                );
                break;
        case "highestPercentile":
            player.games[index].tournaments.sort((tournament1, tournament2) =>
                comparePercentiles(tournament1, tournament2, tournamentsData, 1)
            );
        case "lowestPercentile":
            player.games[index].tournaments.sort((tournament1, tournament2) =>
                comparePercentiles(tournament1, tournament2, tournamentsData, -1)
            );
        case "highestEntrants":
            player.games[index].tournaments.sort((tournament1, tournament2) =>
            compareEntrants(tournament1, tournament2, tournamentsData, 1)
        ); 
        case "lowestEntrants":
            player.games[index].tournaments.sort((tournament1, tournament2) =>
            compareEntrants(tournament1, tournament2, tournamentsData, -1)
        ); 
        case "newest":
            player.games[index].tournaments.sort((tournament1, tournament2) =>
            compareDates(tournament1, tournament2, tournamentsData, 1)
        ); 
        case "oldest":
            player.games[index].tournaments.sort((tournament1, tournament2) =>
            compareDates(tournament1, tournament2, tournamentsData, -1)
        ); 
        case "alphanumerical":
            player.games[index].tournaments.sort((tournament1, tournament2) =>
            compareNames(tournament1, tournament2, tournamentsData, 1)
        ); 
        case "reverseAlphanumerical":
            player.games[index].tournaments.sort((tournament1, tournament2) =>
            compareNames(tournament1, tournament2, tournamentsData, -1)
        ); 
        default:
            break;
    }
    return player;
}

const comparePlayed = (opponent1, opponent2, type) => {
    let val = opponent1.tournaments.length - opponent2.tournaments.length
    if(type === -1){
        return -val
    }
    return val
} 

const compareWinrate = (opponent1, opponent2, type) => {
    let wins1 = 0
    let wins2 = 0
    for(const match of opponent1.tournaments){
        if(match.type === "win"){
            wins1 = wins1 + 1
        }
    }
    for(const match of opponent2.tournaments){
        if(match.type === "win"){
            wins2 = wins2 + 1
        }
    }
    let val = (wins1/opponent1.tournaments.length) - (wins2/opponent2.tournaments.length)
    if(val === 0){
        val = opponent1.tournaments.length - opponent2.tournaments.length
    }
    if(type === -1){
        return -val
    }
    return val
}

const comparePlayerNames = (opponent1, opponent2, type) => {
    let val = opponent1.opponentName.toLowerCase().localeCompare(opponent2.opponentName.toLowerCase(), undefined, { numeric: true, sensitivity: 'base' });
    if(type === -1){
        return -val
    }else{
        return val
    }
}

const compareRecency = (opponent1, opponent2, opponents, type) => {
    let val = opponents[opponent1.opponentId].mostRecent - opponents[opponent2.opponentId].mostRecent
    if(val === 0){
        val = opponent1.tournaments.length - opponent2.tournaments.length
    }
    if(type === -1){
        return -val
    }
    return val 
}

const sortOpponents = async (player, videogameId, type) => {
    stringCheck(type, "type");
    atLeast(type, 1, "type");
    const index = await getGameFromPlayer(parseInt(player._id), videogameId);
    let opponents = {}
    if(type === "newest" || type === "oldest"){
        for(const opponent of player.games[index].opponents){
            let mostRecent = -1
            for(const match of opponent.tournaments){
                const tournament = await getMainTournament(match.tournamentId)
                const event = await getTournament(match.tournamentId, match.eventId)
                if(mostRecent < tournament.events[event].startAt){
                    mostRecent = tournament.events[event].startAt
                }
            }
            opponents[opponent.opponentId] = {mostRecent: mostRecent}
        }
    }
    switch (type) {
        case "mostPlayed":
            player.games[index].opponents.sort((opponent1, opponent2) =>
                comparePlayed(opponent1, opponent2, -1)
            );
            break
        case "leastPlayed":
            player.games[index].opponents.sort((opponent1, opponent2) =>
                comparePlayed(opponent1, opponent2, 1)
            );
            break
        case "highestWinrate":
            player.games[index].opponents.sort((opponent1, opponent2) =>
                compareWinrate(opponent1, opponent2, -1))
            break
        case "lowestWinrate":
            player.games[index].opponents.sort((opponent1, opponent2) =>
                compareWinrate(opponent1, opponent2, 1))
            break
        case "newest":
            player.games[index].opponents.sort((opponent1, opponent2) =>
            compareRecency(opponent1, opponent2, opponents, -1))
            break
        case "oldest":
            player.games[index].opponents.sort((opponent1, opponent2) =>
            compareRecency(opponent1, opponent2, opponents, 1))
            break
        case "alphanumerical":
            player.games[index].opponents.sort((opponent1, opponent2) =>
            comparePlayerNames(opponent1, opponent2, 1))
            break
        case "reverseAlphanumerical":
            player.games[index].opponents.sort((opponent1, opponent2) =>
            comparePlayerNames(opponent1, opponent2, -1))
            break
        case "hasRank":
            player.games[index].opponents.sort((opponent1, opponent2) =>
            comparePlayerNames(opponent1, opponent2, -1))
            break
        default:
            break
    }
    return player;
}

export{
    setsRequest,
    do_h2h,
    calcAvgPlacement,
    updateNames,
    finish_h2h,
    seasonFilter,
    playerEligible,
    playerFilter,
    searchForPlayer,
    tournamentFilter,
    sortTournaments,
    sortOpponents
}