import { atLeast, doRequest, intCheck, numCheck, stringCheck } from "../helpers.js"
import { changeName } from "./players.js"
import { getRegion } from "./regions.js"
import { createPlayerLoss, createPlayerTourney, createPlayerWin, editPlayerLoss, editPlayerWin, getPlayerLoss, getPlayerTourney, getPlayerWin, getSeason, getSeasonInfo } from "./seasons.js"
import { createTournament, editTournamentEligible, getTournament } from "./tournaments.js"

const createNewTournament = async (eventId, result, seasonIndex, placement, regionId, playerId, seasonName) => {
    const query = `query Event($id: ID!) {
        event(id: $id) {
          startAt
          type
          tournament {
            name
            addrState
            id
          }
          isOnline
          numEntrants
        }
      }`
      const response = await doRequest(query, eventId, 0, 0, (result.region).players[result.index].seasons[seasonIndex].startDate, 0)
      const data = response.data
      let event = data.event
      let tournament
      let eligible = false
      if(event.startAt >= (result.region).players[result.index].seasons[seasonIndex].startDate
      && event.startAt <= (result.region).players[result.index].seasons[seasonIndex].endDate
      && event.type === 1){
        try{
            tournament = await getTournament(event.tournament.id)
        }catch(e){
            if(!event.tournament.addrState){
                event.tournament.addrState = "N/A"
            }
            tournament = await createTournament(event.tournament.id, event.tournament.name, event.numEntrants, event.tournament.addrState)
        }
        const eligibleIndex = tournament.eligible.findIndex(region => region.regionName === (result.region).regionName)
        if(eligibleIndex !== -1 && tournament.eligible[eligibleIndex].eligible){
            await createPlayerTourney(regionId, playerId, seasonName, tournament._id, placement)
        }
        else{
            eligible = (!(!(result.region).onlineAllowed && event.isOnline) && !((result.region).minimumEntrants > event.numEntrants))
            tournament.eligible.push({regionName: (result.region).regionName, eligible: eligible})
            await editTournamentEligible(tournament._id, tournament.eligible)
            if(eligible){
                await createPlayerTourney(regionId, playerId, seasonName, tournament._id, placement)
            }
        }   
    }
    return tournament
}

const tournamentRequest = async (regionId, playerId, seasonName) => {
//    let result = await getSeasonInfo(regionId, playerId, seasonName)
//    const seasonIndex = await getSeason(regionId, playerId, seasonName)
//    const query = `
//     query Tourneys($id: ID!, $limit: Int!, $videogameId: ID!) {
//         player(id: $id) {
//             gamerTag
//             recentStandings(videogameId: $videogameId, limit: $limit) {
//                 placement
//                 container {
//                     ... on Event {
//                         startAt
//                         type
//                         tournament {
//                             name
//                             addrState
//                             id
//                         }
//                         isOnline
//                         numEntrants
//                     }
//                 }
//             }
//         }
//     }
//     `
//    const response = await doRequest(query, playerId, (result.region).gameId, 3, (result.region).players[result.index].seasons[seasonIndex].startDate, 0)
//    const data = response.data
//    let standings = data.player.recentStandings
//    if(data.player.gamerTag != (result.region).players[result.index].gamerTag){
//     await changeName(regionId, playerId, data.gamerTag)
//    }
//    standings = standings.filter(standing => standing.container.startAt >= (result.region).players[result.index].seasons[seasonIndex].startDate)
//    standings = standings.filter(standing => standing.container.startAt <= (result.region).players[result.index].seasons[seasonIndex].endDate)
//    standings = standings.filter(standing => standing.container.type === 1)
//    let tournament
//    let eligible
//    for(const standing of standings){
//         try{
//             tournament = await getTournament(standing.container.tournament.id)
//         }catch(e){
//             if(!standing.container.tournament.addrState){
//                 standing.container.tournament.addrState = "N/A"
//             }
//             tournament = await createTournament(standing.container.tournament.id, standing.container.tournament.name, standing.container.numEntrants, standing.container.tournament.addrState)
//         }
//         const eligibleIndex = tournament.eligible.findIndex(region => region.regionName === (result.region).regionName)
//         if(eligibleIndex !== -1 && tournament.eligible[eligibleIndex].eligible){
//             await createPlayerTourney(regionId, playerId, seasonName, tournament._id, standing.placement)
//         }
//         else{
//             eligible = (!(!(result.region).onlineAllowed && standing.container.isOnline) && !((result.region).minimumEntrants > standing.container.numEntrants))
//             tournament.eligible.push({regionName: (result.region).regionName, eligible: eligible})
//             await editTournamentEligible(tournament._id, tournament.eligible)
//             if(eligible){
//                 await createPlayerTourney(regionId, playerId, seasonName, tournament._id, standing.placement)
//             }
//         }
//    }
//    return "successful"
}

const setsRequest = async (regionId, playerId, seasonName) => {
    let result = await getSeasonInfo(regionId, playerId, seasonName)
    const seasonIndex = await getSeason(regionId, playerId, seasonName)
    let page = 1
    let sets = []
    do{
        const query = `
        query Sets($id: ID!, $limit: Int!, $updatedAfter: Timestamp!, $page: Int!) {
            player(id: $id) {
                sets(perPage: $limit, page: $page, filters: {updatedAfter: $updatedAfter}) {
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
                        id
                        winnerId
                        displayScore
                        completedAt
                        event {
                            id
                            type
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
        const response = await doRequest(query, playerId, (result.region).gameId, 50, (result.region).players[result.index].seasons[seasonIndex].startDate, page)
        const data = response.data
        sets = data.player.sets.nodes
        let placement
        let tournament
        let eligibleIndex
        sets = sets.filter(set => set.completedAt <= (result.region).players[result.index].seasons[seasonIndex].endDate)
        sets = sets.filter(set => set.event.type === 1)
        sets = sets.filter(set => set.displayScore !== "DQ")
        sets = sets.filter(set => set.event.videogame.id === (result.region).gameId)
        let opponentId, opponentName, winIndex, lossIndex, participant, won
        for(const set of sets){
            try{
                result = await getSeasonInfo(regionId, playerId, seasonName)
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
                        placement = slot.entrant.standing.placement
                    }
                }
                try{
                    tournament = await getTournament(set.event.tournament.id)
                }catch(e){
                    tournament = await createNewTournament(set.event.id, result, seasonIndex, placement, regionId, playerId, seasonName)
                }
                eligibleIndex = tournament.eligible.findIndex(region => region.regionName === (result.region).regionName)
                try{
                    await getPlayerTourney(regionId, playerId, seasonName, set.event.tournament.id)
                }
                catch(e){
                    try{
                        if(tournament.eligible[eligibleIndex].eligible){
                            await createPlayerTourney(regionId, playerId, seasonName, tournament._id, placement)
                        }
                    }catch(e){
                        console.error(e)
                    }
                }
                if(tournament.eligible[eligibleIndex].eligible){
                    if(won){
                        try{
                            await createPlayerWin(regionId, playerId, seasonName, set.event.tournament.id, opponentName, opponentId, set.id)
                        }
                        catch(e){
                            winIndex = await getPlayerWin(regionId, playerId, seasonName, opponentId)
                            const setIndex = (result.region).players[result.index].seasons[seasonIndex].wins[winIndex].tournaments.findIndex(win => win.setId === set.id)
                            if(setIndex !== -1){
                                throw `win with setId ${setId} already exists`
                            } 
                            (result.region).players[result.index].seasons[seasonIndex].wins[winIndex].tournaments.push({setId: set.id, tournamentId: set.event.tournament.id})
                            await editPlayerWin(regionId, playerId, seasonName, opponentId, {tournaments: (result.region).players[result.index].seasons[seasonIndex].wins[winIndex].tournaments})
                        }
                    }
                    else{
                        try{
                            await createPlayerLoss(regionId, playerId, seasonName, set.event.tournament.id, opponentName, opponentId, set.id)
                        }
                        catch(e){
                            lossIndex = await getPlayerLoss(regionId, playerId, seasonName, opponentId)
                            const setIndex = (result.region).players[result.index].seasons[seasonIndex].losses[lossIndex].tournaments.findIndex(loss => loss.setId === set.id)
                            if(setIndex !== -1){
                                throw `loss with setId ${setId} already exists`
                            } 
                            (result.region).players[result.index].seasons[seasonIndex].losses[lossIndex].tournaments.push({setId: set.id, tournamentId: set.event.tournament.id})
                            await editPlayerLoss(regionId, playerId, seasonName, opponentId, {tournaments: (result.region).players[result.index].seasons[seasonIndex].losses[lossIndex].tournaments})
                        }
                    }
                }
            }
            catch(e){
                console.error(e)
            }
        }
        page = page + 1
    }while(sets.length !== 0)
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
                h2h[player.gamerTag] = newPlayerH2H
            }
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
export{
    setsRequest,
    tournamentRequest,
    do_h2h
}