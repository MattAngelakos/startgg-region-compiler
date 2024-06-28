import { atLeast, doRequest, intCheck, numCheck, stringCheck, objectCheck, arrayCheck, sortLev, createDate } from "../helpers.js"
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
    try {
        tournament = await getMainTournament(event.tournament.id)
    } catch (e) {
        tournament = await createTournament(event.tournament.id, event.tournament.name, event.tournament.addrState)
    }
    let foundEvent
    try {
        foundEvent = await getTournament(tournament._id, eventId)
    }
    catch (e) {
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
    do {
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
        for (const set of sets) {
            try {
                player = await getPlayer(playerId)
                if (set === player.games[gameIndex].lastRecordedSet) {
                    return
                }
                if (i) {
                    newLastRecordedSet = set
                    i = false
                }
                for (const slot of set.slots) {
                    participant = slot.entrant.participants[0];
                    if (participant.player.id !== playerId) {
                        opponentName = participant.gamerTag,
                            opponentId = participant.player.id
                        if (slot.entrant.id === set.winnerId) {
                            won = false
                        }
                        else {
                            won = true
                        }
                    }
                    else {
                        entrantId = slot.entrant.id
                        placement = slot.entrant.standing.placement
                    }
                }
                let opponent
                try {
                    opponent = await getPlayer(opponentId)
                } catch (e) {
                    opponent = await createPlayer(opponentId, opponentName)
                }
                try {
                    await getGameFromPlayer(opponentId, videogameId)
                } catch (e) {
                    await createGameForPlayer(opponentId, videogameId)
                }
                try {
                    tournament = await getTournament(set.event.tournament.id, set.event.id)
                } catch (e) {
                    tournament = await createNewTournament(set.event.id, placement, playerId)
                }
                try {
                    await getTournamentFromPlayer(playerId, videogameId, set.event.tournament.id, set.event.id)
                }
                catch (e) {
                    try {
                        await createTournamentForPlayer(playerId, videogameId, set.event.tournament.id, set.event.id, placement)
                    } catch (e) {
                        console.error(e)
                    }
                }
                if (won) {
                    try {
                        await createPlayerWin(playerId, videogameId, set.event.tournament.id, set.event.id, opponentName, opponentId, set.id)
                    }
                    catch (e) {
                        console.log(e)
                        winIndex = await getPlayerWin(playerId, videogameId, opponentId)
                        const setIndex = player.games[gameIndex].opponents[winIndex].tournaments.findIndex(win => win.setId === set.id)
                        if (setIndex !== -1) {
                            throw `win with setId ${setId} already exists`
                        }
                        player.games[gameIndex].opponents[winIndex].tournaments.push({ setId: set.id, tournamentId: set.event.tournament.id, eventId: set.event.id, type: 'win', matches: [] })
                        await editPlayerWin(playerId, videogameId, opponentId, { tournaments: player.games[gameIndex].opponents[winIndex].tournaments })
                    }
                }
                else {
                    try {
                        await createPlayerLoss(playerId, videogameId, set.event.tournament.id, set.event.id, opponentName, opponentId, set.id)
                    }
                    catch (e) {
                        lossIndex = await getPlayerLoss(playerId, videogameId, opponentId)
                        const setIndex = player.games[gameIndex].opponents[lossIndex].tournaments.findIndex(win => win.setId === set.id)
                        if (setIndex !== -1) {
                            throw `loss with setId ${setId} already exists`
                        }
                        player.games[gameIndex].opponents[lossIndex].tournaments.push({ setId: set.id, tournamentId: set.event.tournament.id, eventId: set.event.id, type: 'loss', matches: [] })
                        await editPlayerLoss(playerId, videogameId, opponentId, { tournaments: player.games[gameIndex].opponents[lossIndex].tournaments })
                    }
                }
                let playerChar
                let opponentChar
                let stage
                if (set.games) {
                    let i = 1
                    for (const game of set.games) {
                        if (game.selections) {
                            for (const participant of game.selections) {
                                if (participant.entrant.id === entrantId) {
                                    try {
                                        await addPlay(playerId, videogameId, participant.character.name)
                                    }
                                    catch (e) {
                                        console.log(e)
                                        await createPlayerCharacter(playerId, videogameId, participant.character.name)
                                    }
                                    playerChar = participant.character.name
                                }
                                else {
                                    opponentChar = participant.character.name
                                }
                            }
                        }
                        else {
                            playerChar = "N/A"
                            opponentChar = "N/A"
                        }
                        try {
                            stage = game.stage.name
                        } catch (e) {
                            stage = "N/A"
                        }
                        if (playerChar === null) {
                            playerChar = "N/A"
                        }
                        if (opponentChar === null) {
                            opponentChar = "N/A"
                        }
                        if (stage === null) {
                            stage = "N/A"
                        }
                        try {
                            if (game.winnerId === entrantId) {
                                await createPlayerMatch(playerId, videogameId, opponentId, set.id, 'win', playerChar, opponentChar, i, stage)
                            }
                            else {
                                await createPlayerMatch(playerId, videogameId, opponentId, set.id, 'loss', playerChar, opponentChar, i, stage)
                            }
                        } catch (e) {
                            console.log(e)
                        }
                        i = i + 1
                    }
                }
            }
            catch (e) {
                console.error(e)
            }
        }
        page = page + 1
        if (page % 15 === 0) {
            await new Promise(r => setTimeout(r, 60000));
        }
        await new Promise(r => setTimeout(r, 20000));
    } while (page !== 10)
    player.games[gameIndex].lastRecordedSet = newLastRecordedSet
    await editPlayer(playerId, player)
    return "success"
}

const seasonFilter = async (regionId, seasonName, playerId) => {
    let region = await getRegion(regionId)
    const seasonIndex = await getSeason(regionId, seasonName)
    const index = region.seasons[seasonIndex].players.findIndex(player => player === playerId)
    if (index === -1) {
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


const do_h2h = async (regionId, seasonName, tournaments) => {
    let opponentIndex
    let h2h = {}
    let region = await getRegion(regionId)
    seasonName = stringCheck(seasonName, "seasonName")
    atLeast(seasonName, 1, "seasonName")
    const seasonIndex = await getSeason(regionId, seasonName)
    let i = 0
    for (const playerId of region.seasons[seasonIndex].players) {
        try {
            let player = await seasonFilter(regionId, seasonName, playerId)
            if (tournaments) {
                player = await tournamentFilter(player, region.gameId, tournaments)
            }
            i = i + 1
            let newPlayerH2H = {
                id: playerId,
            }
            for (let j = i; j < region.seasons[seasonIndex].players.length; j++) {
                let wins
                let losses
                let opponent
                try {
                    const gameIndex = await getGameFromPlayer(playerId, region.gameId)
                    opponent = await getPlayer(region.seasons[seasonIndex].players[j])
                    opponentIndex = player.games[gameIndex].opponents.findIndex(record => record.opponentId === region.seasons[seasonIndex].players[j])
                    if (opponentIndex === -1) {
                        wins = []
                        losses = []
                    } else {
                        wins = player.games[gameIndex].opponents[opponentIndex].tournaments.filter(set => set.type === 'win')
                        losses = player.games[gameIndex].opponents[opponentIndex].tournaments.filter(set => set.type === 'loss')
                    }
                }
                catch (e) {
                    wins = []
                    losses = []
                    console.log(e)
                }
                newPlayerH2H[opponent.gamerTag] = { wins: wins.length, losses: losses.length }
            }
            h2h[player.gamerTag] = newPlayerH2H
        }
        catch (e) {
            console.error(e)
            h2h.forEach(obj => {
                delete obj[player.gamerTag];
            });
            continue
        }
    }
    return h2h
}

const finish_h2h = (h2h) => {
    const keys = Object.keys(h2h)
    for (let i = keys.length - 1; i >= 0; i--) {
        //console.log(`i: ${keys[i]}`)
        const keyI = keys[i];
        for (let j = 0; j < i; j++) {
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
    if (minimumEntrants >= maximumEntrants) {
        throw 'invalid range'
    }
    for (const tournament of tournaments) {
        objectCheck(tournament, "tournament")
        const currTournament = await getTournament(tournament.tourneyId)
        if (currTournament.entrants >= minimumEntrants && currTournament.entrants <= maximumEntrants) {
            avg = avg + tournament.placement
            numOfBrackets = numOfBrackets + 1
        }
    }
    return avg / numOfBrackets
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
    if (data.data.player.gamerTag !== region.players[i].gamerTag) {
        player.gamerTag = data.data.player.gamerTag
    }
    await editPlayer(playerId, player)
    return player
}

const updateNames = async (playerIds) => {
    let changes = []
    for (const playerId in playerIds) {
        try {
            await updateName(playerId)
            changes.push(`${playerId} updated`)
        } catch (e) {
            changes.push(`${playerId} update failed: ${e}`)
        }
    }
    return changes
}

const tournamentFilter = async (player, videogameId, eventIds) => {
    for (const eventId of eventIds) {
        numCheck(eventId, "eventId")
        intCheck(eventId, "eventId")
    }
    const videogameIndex = await getGameFromPlayer(parseInt(player._id), videogameId)
    player.games[videogameIndex].tournaments = player.games[videogameIndex].tournaments.filter(event => !eventIds.includes(event.eventId))
    for (let i = 0; i < player.games[videogameIndex].opponents.length; i++) {
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
        val = fullTournament2.events[index2].entrants - fullTournament1.events[index1].entrants;
    }
    if (type === -1) {
        return -val
    } else {
        return val
    }
};

const comparePercentiles = (tournament1, tournament2, tournamentsData, type) => {
    const { fullTournament: fullTournament1, eventIndex: index1 } = tournamentsData[tournament1.tournamentId];
    const { fullTournament: fullTournament2, eventIndex: index2 } = tournamentsData[tournament2.tournamentId];
    let val = ((fullTournament2.events[index2].entrants - tournament2.placement) / fullTournament2.events[index2].entrants) - ((fullTournament1.events[index1].entrants - tournament1.placement) / fullTournament1.events[index1].entrants);
    if (val === 0) {
        fullTournament2.events[index2].entrants - fullTournament1.events[index1].entrants;
    }
    if (type === -1) {
        return -val
    } else {
        return val
    }
}

const compareEntrants = (tournament1, tournament2, tournamentsData, type) => {
    const { fullTournament: fullTournament1, eventIndex: index1 } = tournamentsData[tournament1.tournamentId];
    const { fullTournament: fullTournament2, eventIndex: index2 } = tournamentsData[tournament2.tournamentId];
    let val = fullTournament2.events[index2].entrants - fullTournament1.events[index1].entrants;
    if (type === -1) {
        return -val
    } else {
        return val
    }
}

const compareDates = (tournament1, tournament2, tournamentsData, type) => {
    const { fullTournament: fullTournament1, eventIndex: index1 } = tournamentsData[tournament1.tournamentId];
    const { fullTournament: fullTournament2, eventIndex: index2 } = tournamentsData[tournament2.tournamentId];
    let val = fullTournament2.events[index2].startedAt - fullTournament1.events[index1].startedAt;
    if (type === -1) {
        return -val
    } else {
        return val
    }
}

const compareNames = (tournament1, tournament2, tournamentsData, type) => {
    const { fullTournament: fullTournament1, eventIndex: index1 } = tournamentsData[tournament1.tournamentId];
    const { fullTournament: fullTournament2, eventIndex: index2 } = tournamentsData[tournament2.tournamentId];
    let val = fullTournament1.tournamentName.toLowerCase().localeCompare(fullTournament2.tournamentName.toLowerCase(), undefined, { numeric: true, sensitivity: 'base' });
    if (type === -1) {
        return -val
    } else {
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
    if (type === -1) {
        return -val
    }
    return val
}

const compareWinrate = (opponent1, opponent2, type) => {
    let wins1 = 0
    let wins2 = 0
    for (const match of opponent1.tournaments) {
        if (match.type === "win") {
            wins1 = wins1 + 1
        }
    }
    for (const match of opponent2.tournaments) {
        if (match.type === "win") {
            wins2 = wins2 + 1
        }
    }
    let val = (wins1 / opponent1.tournaments.length) - (wins2 / opponent2.tournaments.length)
    if (val === 0) {
        val = opponent1.tournaments.length - opponent2.tournaments.length
    }
    if (type === -1) {
        return -val
    }
    return val
}

const comparePlayerNames = (opponent1, opponent2, type) => {
    let val = opponent1.opponentName.toLowerCase().localeCompare(opponent2.opponentName.toLowerCase(), undefined, { numeric: true, sensitivity: 'base' });
    if (type === -1) {
        return -val
    } else {
        return val
    }
}

const compareRecency = (opponent1, opponent2, opponents, type) => {
    let val = opponents[opponent1.opponentId].mostRecent - opponents[opponent2.opponentId].mostRecent
    if (val === 0) {
        val = opponent1.tournaments.length - opponent2.tournaments.length
    }
    if (type === -1) {
        return -val
    }
    return val
}

const filterRank = (opponentId, opponents) => {
    return opponents[opponentId].hasRank
}

const sortOpponents = async (player, videogameId, type) => {
    stringCheck(type, "type");
    atLeast(type, 1, "type");
    const index = await getGameFromPlayer(parseInt(player._id), videogameId);
    let opponents = {}
    if (type === "newest" || type === "oldest") {
        for (const opponent of player.games[index].opponents) {
            let mostRecent = -1
            for (const match of opponent.tournaments) {
                const tournament = await getMainTournament(match.tournamentId)
                const event = await getTournament(match.tournamentId, match.eventId)
                if (mostRecent < tournament.events[event].startAt) {
                    mostRecent = tournament.events[event].startAt
                }
            }
            opponents[opponent.opponentId] = { mostRecent: mostRecent }
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
        default:
            break
    }
    return player;
}

const filters = async (player, videogameId, type, entrantMinimum, entrantMaximum, yearMinimum, monthMinumum, dayMinimum, yearMaximum, monthMaximum, dayMaximum) => {
    numCheck(entrantMinimum, "entrantMinimum")
    intCheck(entrantMinimum, "entrantMinimum")
    numCheck(entrantMaximum, "entrantMaximum")
    intCheck(entrantMaximum, "entrantMaximum")
    if (entrantMaximum === 0) {
        entrantMaximum = Number.MAX_SAFE_INTEGER
    }
    const dateMinimum = createDate(monthMinumum, dayMinimum, yearMinimum)
    const dateMaximum = createDate(monthMaximum, dayMaximum, yearMaximum)
    if (dateMinimum >= dateMaximum) {
        throw 'invalid date range'
    }
    stringCheck(type, "type");
    atLeast(type, 1, "type");
    const index = await getGameFromPlayer(parseInt(player._id), videogameId);
    let opponents = {}
    if (type === "hasRank" || type === "noRank") {
        for (const opponent of player.games[index].opponents) {
            const opponentPlayer = await getPlayer(opponent.opponentId)
            const videogameIndex = await getGameFromPlayer(opponent.opponentId, videogameId)
            if (opponentPlayer.games[videogameIndex].rankings.length !== 0) {
                opponents[opponent.opponentId] = { hasRank: true }
            }
            else {
                opponents[opponent.opponentId] = { hasRank: false }
            }
        }
    }
    let brackets = []
    if (type === "onlineOnly" || type === "offlineOnly" || type === "entrantRange" || type === "dateRange") {
        for (const tournament of player.games[index].tournaments) {
            const bracket = await getMainTournament(tournament.tournamentId)
            const event = await getTournament(tournament.tournamentId, tournament.eventId)
            if (type === "onlineOnly") {
                if (!bracket.events[event].isOnline) {
                    brackets.push(tournament.eventId)
                }
            }
            else if (type === "offlineOnly") {
                if (bracket.events[event].isOnline) {
                    brackets.push(tournament.eventId)
                }
            }
            else if (type === "entrantRange") {
                if ((bracket.events[event].entrants < entrantMinimum || bracket.events[event].entrants > entrantMaximum)) {
                    brackets.push(tournament.eventId)
                }
            }
            else if (type === "dateRange") {
                if ((bracket.events[event].startAt < dateMinimum || bracket.events[event].startAt > dateMaximum)) {
                    brackets.push(tournament.eventId)
                }
            }
        }
        type = "filter"
    }
    switch (type) {
        case "filter":
            player = await tournamentFilter(parseInt(player._id), videogameId, brackets)
            break
        case "hasRank":
            player.games[index].opponents = player.games[index].opponents.filter(opponent => {
                return filterRank(opponent.opponentId, opponents)
            })
            break
        case "noRank":
            player.games[index].opponents = player.games[index].opponents.filter(opponent => {
                return !filterRank(opponent.opponentId, opponents)
            })
            break
        default:
            break
    }
    return player;
}

const getEventResultsByRegion = async (regionId, seasonName, tournamentId, eventId) => {
    const region = await getRegion(regionId)
    const index = await getSeason(regionId, seasonName)
    await getTournament(tournamentId, eventId)
    let eventIndex, player, gameIndex
    let results = []
    for (const playerId of region.seasons[index].players) {
        try {
            player = await getPlayer(playerId)
        } catch (e) {
            console.log(`${playerId} does not exist`)
            continue
        }
        try {
            gameIndex = await getGameFromPlayer(playerId, region.gameId)
        } catch (e) {
            console.log(`${playerId} does not have gameId ${region.gameId}}`)
            continue
        }
        try {
            eventIndex = await getTournamentFromPlayer(playerId, region.gameId, tournamentId, eventId)
            let matches = []
            let resultObject = {
                id: player._id,
                gamerTag: player.gamerTag,
                placement: player.games[gameIndex].tournaments[eventIndex].placement
            }
            for (let opponent of player.games[gameIndex].opponents) {
                opponent.tournaments = opponent.tournaments.filter(event => event.eventId === eventId)
                if (opponent.tournaments.length !== 0) {
                    matches.push(opponent)
                }
            }
            resultObject.matches = matches
            results.push(resultObject)
        } catch (e) {
            console.log(e)
            console.log(`${playerId} does not have eventId ${eventId}`)
            continue
        }
    }
    return results
}

const getTournamentsBySeason = async (regionId, seasonName) => {
    const region = await getRegion(regionId)
    const seasonIndex = await getSeason(regionId, seasonName)
    let player, gameIndex
    let results = []
    for (const playerId of region.seasons[seasonIndex].players) {
        try {
            player = await getPlayer(playerId)
        } catch (e) {
            console.log(`${playerId} does not exist`)
            continue
        }
        try {
            gameIndex = await getGameFromPlayer(playerId, region.gameId)
        } catch (e) {
            console.log(`${playerId} does not have gameId ${region.gameId}}`)
            continue
        }
        try {
            player = await seasonFilter(regionId, seasonName, playerId)
            for (let bracket of player.games[gameIndex].tournaments) {
                const index = results.findIndex(result => result.eventId === bracket.eventId)
                if (index === -1) {
                    const tournament = await getMainTournament(bracket.tournamentId)
                    const eventIndex = await getTournament(bracket.tournamentId, bracket.eventId)
                    let tournamentObject = {
                        tournamentId: bracket.tournamentId,
                        eventId: bracket.eventId,
                        nameOfBracket: `${tournament.tournamentName}: ${tournament.events[eventIndex].eventName}`
                    }
                    results.push(tournamentObject)
                }
            }
        } catch (e) {
            console.log(e)
            console.log(`${playerId} does not have eventId ${eventId}`)
            continue
        }
    }
    return results
}

const do_elo = (h2h) => {
    for (let player in h2h) {
        h2h[player].elo = 1500
    }
    function Probability(rating1, rating2) {
        return (
            (1.0 * 1.0) / (1 + 1.0 * Math.pow(10, (1.0 * (rating1 - rating2)) / 400))
        );
    }
    function EloRating(player, opponent, K, d) {
        let Ra = h2h[player].elo
        let Rb = h2h[opponent].elo
        let Pb = Probability(Ra, Rb);
        let Pa = Probability(Rb, Ra);
        if (d === true) {
            Ra = Ra + K * (1 - Pa);
            Rb = Rb + K * (0 - Pb);
        }
        else {
            Ra = Ra + K * (0 - Pa);
            Rb = Rb + K * (1 - Pb);
        }
        h2h[player].elo = Ra
        h2h[opponent].elo = Rb
    }
    for (let player in h2h) {
        for (let opponent in h2h[player]) {
            if (opponent !== 'id') {
                const wins = h2h[player][opponent].wins;
                const losses = h2h[player][opponent].losses;
                for (let i = 0; i < wins; i++) {
                    EloRating(player, opponent, 30, true);
                }
                for (let i = 0; i < losses; i++) {
                    EloRating(player, opponent, 30, false);
                }
            }
        }
    }
    return h2h
}

const do_glicko2 = (h2h) => {
    function convert(player){
        player.rating = (player.rating - 1500.0) / 173.7178
        player.deviation = player.deviation /173.7178
    }
    function unconvert(player){
        player.rating = (player.rating*173.7178)+1500
        player.deviation = player.deviation*173.7178
    }
    function G(p) {
        const scale = p / Math.PI
        return 1.0 / Math.pow((1.0 + 3.0 * scale * scale), 0.5)
    }
    function E(g, u, uj) {
        const exponent = -1.0 * g * (u - uj)
        return 1.0 / (1.0 + Math.pow(Math.E, exponent))
    }
    function F(x, dS, pS, v, a, tS) {
        let eX = Math.pow(Math.E, x)
        let num = eX * (dS - pS - v - eX)
        let den = pS + v + eX
        return (num / (2.0 * den * den)) - ((x - a) / tS)
    }
    function update(m, opponent, score, player) {
        let invV = 0.0
        const g = G(opponent.deviation)
        const e = E(g, player.rating, opponent.rating)
        invV += g * g * e * (1.0 - e)
        const v = 1.0 / invV
        let dInner = 0.0
        for (let j = 0; j < m; j++) {
            dInner += g * (score[j] - e);
        }
        const d = v * dInner;
        const sPrime = Math.pow(Math.E, (Convergence(d, v, player.deviation, player.volatility) / 2.0))
        const pPrime = 1.0 / Math.pow(((1.0 / (player.deviation * player.deviation + sPrime * sPrime)) + invV), 0.5);
        const uPrime = player.rating + pPrime * pPrime * dInner;
        return {uPrime, pPrime, sPrime}
    }
    function decay(p, s) {
        const pPrime = Math.pow((p * p + s * s), 0.5);
        return pPrime
    }
    function Convergence(d, v, p, s) {
        let dS = d * d;
        let pS = p * p;
        let tS = 0.5 * 0.5;
        let a = Math.log(s * s);
        let A = a;
        let B;
        let bTest = dS - pS - v;
        if (bTest > 0.0) {
            B = Math.log(bTest);
        }
        else {
            B = a - 0.5;
            while (F(B, dS, pS, v, a, tS) < 0.0) {
                B -= 0.5;
            }
        }
        let fA = F(A, dS, pS, v, a, tS);
        let fB = F(B, dS, pS, v, a, tS);
        while (Math.abs(B - A) >  0.000001)
        {
            let C = A + (A - B) * fA / (fB - fA);
            let fC = F(C, dS, pS, v, a, tS);

            if (fC * fB < 0.0) {
                A = B;
                fA = fB;
            }
            else {
                fA /= 2.0;
            }

            B = C;
            fB = fC;
        }
        return A;
    }
    for (let player in h2h) {
        h2h[player].rating = 0
        h2h[player].deviation = 350/173.7178
        h2h[player].volatility = 0.06
    }
    for (let player in h2h) {
        for (let opponent in h2h[player]) {
            if (opponent !== 'id' && opponent !== 'rating' && opponent !== 'deviation' && opponent !== 'volatility' && opponent !== 'elo') {
                const wins = h2h[player][opponent].wins;
                const losses = h2h[player][opponent].losses;
                let updatedRatings
                let updatedRatings2
                for (let i = 0; i < wins; i++) {
                    updatedRatings = update(1, h2h[opponent], [1], h2h[player])
                    updatedRatings2 = update(1, h2h[player], [0], h2h[opponent])
                    h2h[player].rating = updatedRatings.uPrime
                    h2h[player].deviation = updatedRatings.pPrime
                    h2h[player].volatility = updatedRatings.sPrime
                    h2h[opponent].rating = updatedRatings2.uPrime
                    h2h[opponent].deviation = updatedRatings2.pPrime
                    h2h[opponent].volatility = updatedRatings2.sPrime
                }
                for (let i = 0; i < losses; i++) {
                    updatedRatings = update(1, h2h[opponent], [0], h2h[player])
                    updatedRatings2 = update(1, h2h[player], [1], h2h[opponent])
                    h2h[player].rating = updatedRatings.uPrime
                    h2h[player].deviation = updatedRatings.pPrime
                    h2h[player].volatility = updatedRatings.sPrime
                    h2h[opponent].rating = updatedRatings2.uPrime
                    h2h[opponent].deviation = updatedRatings2.pPrime
                    h2h[opponent].volatility = updatedRatings2.sPrime
                }
                // const updatedRatings = update(1, [h2h[opponent]], [wins, losses], h2h[player])
                // h2h[player].rating = updatedRatings.uPrime
                // h2h[player].deviation = updatedRatings.pPrime
                // h2h[player].volatility = updatedRatings.sPrime
            }
        }
    }
    for (let player in h2h) {
        h2h[player].rating = (h2h[player].rating*173.7178)+1500
        h2h[player].deviation = h2h[player].deviation*173.7178
        h2h[player].volatility = 0.06
    }
    return h2h
}


export {
    setsRequest,
    getTournamentsBySeason,
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
    sortOpponents,
    filters,
    getEventResultsByRegion,
    do_elo,
    do_glicko2
}