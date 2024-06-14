import { atLeast, doRequest, intCheck, numCheck, stringCheck, objectCheck, arrayCheck } from "../helpers.js"
import { addPlay, createPlayerCharacter } from "./characters.js"
import { createPlayerLoss, createPlayerWin, createTournamentForPlayer, editPlayer, editPlayerLoss, editPlayerWin, getGameFromPlayer, getPlayer, getPlayerLoss, getPlayerWin, getTournamentFromPlayer } from "./players.js"
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
                        player.games[gameIndex].opponents[winIndex].tournaments.push({setId: set.id, tournamentId: set.event.tournament.id, eventId: set.event.id, type: 'win'})
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
                        player.games[gameIndex].opponents[lossIndex].tournaments.push({setId: set.id, tournamentId: set.event.tournament.id, eventId: set.event.id, type: 'loss'})
                        await editPlayerLoss(playerId, videogameId, opponentId, {tournaments: player.games[gameIndex].opponents[lossIndex].tournaments})
                    }
                }
                if(set.games){
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
                                }
                            }             
                        }
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
    }while(page !== 10)
    player.games[gameIndex].lastRecordedSet = newLastRecordedSet
    await editPlayer(playerId, player)
    return "success"
}

const do_h2h = async (regionId, seasonName) => {
    let seasonIndex, winIndex, lossIndex
    let h2h = {}
    let region = await getRegion(regionId)
    seasonName = stringCheck(seasonName, "seasonName")
    atLeast(seasonName, 1, "seasonName")
    let i = 0
    for(const player of region.players){
        try{
            seasonIndex = await getSeason(regionId, player.playerId, seasonName)
            i = i+1
            let newPlayerH2H = {
                id: player.playerId,
            }
            for (let j = i; j < region.players.length; j++) {
                try{
                    winIndex = await getPlayerWin(regionId, player.playerId, seasonName, region.players[j].playerId)
                    winIndex = player.seasons[seasonIndex].wins[winIndex].tournaments.length
                }
                catch(e){
                    winIndex = 0
                }
                try{
                    lossIndex = await getPlayerLoss(regionId, player.playerId, seasonName, region.players[j].playerId)
                    lossIndex = player.seasons[seasonIndex].losses[lossIndex].tournaments.length
                }
                catch(e){
                    lossIndex = 0
                }
                newPlayerH2H[region.players[j].gamerTag] = {wins: winIndex, losses: lossIndex}
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

const calcAvgPlacement = async (tournaments, minimumEntrants, maximumEntrants) => {
    let avg = 0
    let numOfBrackets = 0
    arrayCheck(tournaments, "tournaments")
    numCheck(minimumEntrants, "minimumEntrants")
    intCheck(minimumEntrants, "minimumEntrants")
    numCheck(maximumEntrants, "maximumEntrants")
    intCheck(maximumEntrants, "maximumEntrants")
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

const updateNames = async (regionId) => {
    const query = `
    query Name($id: ID!) {
        player(id: $id) {
            gamerTag
        }
    }
    `
    regionId = idCheck(regionId, "regionId")
    let region = await getRegion(regionId)
    for(let i = 0; i < region.players.length; i++){
        numCheck(region.players[i], "playerId")
        intCheck(region.players[i], "playerId")
        const data = await doRequest(query, region.players[i].playerId, 0, 0, 0, 0)
        if(data.data.player.gamerTag !== region.players[i].gamerTag){
            region.players[i].gamerTag = data.data.player.gamerTag
        }
        await editRegion(regionId, region)
    }
    return region.players
}

export{
    setsRequest,
    do_h2h,
    calcAvgPlacement,
    updateNames,
    finish_h2h
}