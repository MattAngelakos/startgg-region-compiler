import { atLeast, doRequest, intCheck, numCheck, stringCheck, objectCheck, arrayCheck, sortLev, createDate, reduceEventNames } from "../helpers.js"
import { addPlay, createPlayerCharacter } from "./characters.js"
import { createGameForPlayer, createPlayer, createPlayerLoss, createPlayerMatch, createPlayerWin, createTournamentForPlayer, editPlayer, editPlayerLoss, editPlayerWin, getAllPlayers, getGameFromPlayer, getPlayer, getPlayerLoss, getPlayerWin, getTournamentFromPlayer } from "./players.js"
import { getRegion } from "./regions.js"
import { tournaments as tournaments_collection } from "../config/mongoCollections.js"
import { getSeason } from "./seasons.js"
import { createEvent, createTournament, getMainTournament, getTournament } from "./tournaments.js"

const createNewTournament = async (eventId, placement, playerId) => {
    const query = `query Event($id: ID!) {
        event(id: $id) {
          startAt
          type
          name
          tournament {
            id
            name
            city
            addrState
            countryCode
            images{
                type
                url
            }
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
    let banner = "N/A"
    let pfp = "N/A"
    for (const image of event.tournament.images) {
        if (image.type === 'banner') {
            pfp = image.url
        }
        else if (image.type === 'profile') {
            banner = image.url
        }
    }
    let tournament
    try {
        tournament = await getMainTournament(event.tournament.id)
    } catch (e) {
        tournament = await createTournament(event.tournament.id, event.tournament.name, event.tournament.addrState, event.tournament.city, event.tournament.countryCode, pfp, banner)
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

// Stored gamerTags go stale as players rename themselves. The tag inside a set's
// participants is the tag used at that event, so a fresh player lookup is the
// only way to get the current one.
const refreshGamerTag = async (playerId) => {
    const query = `
    query Tag($id: ID!) {
        player(id: $id) {
            gamerTag
            user {
                images {
                    type
                    url
                }
            }
        }
    }
    `
    const response = await doRequest(query, playerId, 0, 0, 0, 0)
    const live = response.data && response.data.player
    if (!live || !live.gamerTag) return null

    const player = await getPlayer(playerId)
    const previousTag = player.gamerTag
    let pfp = player.pfp
    if (live.user && live.user.images) {
        for (const image of live.user.images) {
            if (image.type === 'profile') pfp = image.url
        }
    }
    const tagChanged = live.gamerTag !== previousTag
    const pfpChanged = pfp !== player.pfp
    if (!tagChanged && !pfpChanged) return null

    player.gamerTag = live.gamerTag
    player.pfp = pfp
    await editPlayer(playerId, player)
    return {
        playerId: playerId,
        from: previousTag,
        to: live.gamerTag,
        tagChanged: tagChanged,
        pfpChanged: pfpChanged
    }
}

const setsRequest = async (playerId, videogameId, options = {}) => {
    // since:     only ask for sets created/updated after this unix timestamp.
    //            Pass a season start and the API does the date filtering for us
    //            instead of us paging through a player's whole career.
    // maxPages:  hard ceiling so a first-ever sync can't run away.
    // perPage:   25 by default; 30 is the hard ceiling the 1000-object
    //            complexity cap allows for this query shape, and the page size
    //            is halved automatically if a page still overshoots.
    const since = options.since ?? 0
    const maxPages = options.maxPages ?? 20
    let perPage = options.perPage ?? 25
    // A full resync has to walk past the watermark, otherwise it stops at the
    // newest set already on file and re-reads nothing.
    const ignoreWatermark = options.ignoreWatermark === true

    let player = await getPlayer(playerId)
    const gameIndex = await getGameFromPlayer(playerId, videogameId)
    const previous = player.games[gameIndex].lastRecordedSet
    const lastRecordedId = !ignoreWatermark && previous && previous.id ? previous.id : null
    let page = 1
    let sets = []
    let i = true
    let newLastRecordedSet
    let reachedKnownSet = false
    let totalPages = null
    let processed = 0
    let pagesFetched = 0
    do {
        const query = `
        query Sets($id: ID!, $limit: Int!, $page: Int!, $updatedAfter: Timestamp!) {
            player(id: $id) {
                sets(perPage: $limit, page: $page, filters: {updatedAfter: $updatedAfter}) {
                    pageInfo {
                        totalPages
                    }
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
        let response
        try {
            response = await doRequest(query, playerId, videogameId, perPage, since, page)
        } catch (e) {
            // A page of unusually long sets can blow the object cap; halve the
            // page size and retry the same page rather than losing it.
            if (e.name === 'ComplexityError' && perPage > 5) {
                perPage = Math.max(5, Math.floor(perPage / 2))
                console.warn(`complexity cap hit, retrying page ${page} at perPage ${perPage}`)
                continue
            }
            throw e
        }
        const data = response.data
        if (!data || !data.player || !data.player.sets) {
            break
        }
        pagesFetched = pagesFetched + 1
        totalPages = data.player.sets.pageInfo.totalPages
        sets = data.player.sets.nodes
        if (sets.length === 0) {
            break
        }
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
                // Compare by set id: the stored set is a separate object from
                // the freshly fetched one, so `===` was never true here and
                // every sync re-walked sets that were already recorded.
                if (lastRecordedId !== null && set.id === lastRecordedId) {
                    reachedKnownSet = true
                    break
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
                        await createPlayerWin(playerId, videogameId, set.event.tournament.id, set.event.id, opponentName, opponentId, set.id, set.completedAt)
                    }
                    catch (e) {
                        winIndex = await getPlayerWin(playerId, videogameId, opponentId)
                        const setIndex = player.games[gameIndex].opponents[winIndex].tournaments.findIndex(win => win.setId === set.id)
                        if (setIndex !== -1) {
                            throw `win with setId ${set.id} already exists`
                        }
                        player.games[gameIndex].opponents[winIndex].tournaments.push({ setId: set.id, tournamentId: set.event.tournament.id, eventId: set.event.id, type: 'win', completedAt: set.completedAt ?? null, matches: [] })
                        await editPlayerWin(playerId, videogameId, opponentId, { tournaments: player.games[gameIndex].opponents[winIndex].tournaments })
                    }
                }
                else {
                    try {
                        await createPlayerLoss(playerId, videogameId, set.event.tournament.id, set.event.id, opponentName, opponentId, set.id, set.completedAt)
                    }
                    catch (e) {
                        lossIndex = await getPlayerLoss(playerId, videogameId, opponentId)
                        const setIndex = player.games[gameIndex].opponents[lossIndex].tournaments.findIndex(win => win.setId === set.id)
                        if (setIndex !== -1) {
                            throw `loss with setId ${set.id} already exists`
                        }
                        player.games[gameIndex].opponents[lossIndex].tournaments.push({ setId: set.id, tournamentId: set.event.tournament.id, eventId: set.event.id, type: 'loss', completedAt: set.completedAt ?? null, matches: [] })
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
                        // `== null` on purpose: these are declared outside the
                        // per-game loop, so a game that reports only one side's
                        // character leaves the other undefined, not null, and
                        // the strict check let it through to fail validation.
                        if (playerChar == null) {
                            playerChar = "N/A"
                        }
                        if (opponentChar == null) {
                            opponentChar = "N/A"
                        }
                        if (stage == null) {
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
        processed = processed + sets.length
        if (reachedKnownSet) {
            break
        }
        page = page + 1
        // Pacing is handled centrally by the rate limiter in startgg.js, so no
        // blind sleeps are needed here.
    } while (page <= maxPages && (totalPages === null || page <= totalPages))

    // Save the watermark even when we stopped early on a known set, otherwise
    // the next run starts from the same stale point and re-reads everything.
    if (newLastRecordedSet) {
        player = await getPlayer(playerId)
        player.games[gameIndex].lastRecordedSet = newLastRecordedSet
        player.games[gameIndex].lastSyncedAt = Math.floor(Date.now() / 1000)
        await editPlayer(playerId, player)
    }
    return `success (${processed} sets scanned over ${pagesFetched} page(s)${reachedKnownSet ? ', stopped at last recorded set' : ''})`
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
            // A Set has .size, not .length. Reading .length gave undefined, and
            // `undefined < n` is false, so this rule never rejected anyone.
            if (uniqueEvents.size < region.minimumUniqueEvents) {
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


// playerIds, when given, restricts the matrix to those roster members. The
// ratings are computed from whatever this returns, so narrowing here means the
// server rates the filtered set directly instead of the client re-deriving it.
const do_h2h = async (regionId, seasonName, tournaments, playerIds) => {
    let opponentIndex
    let h2h = {}
    let region = await getRegion(regionId)
    seasonName = stringCheck(seasonName, "seasonName")
    atLeast(seasonName, 1, "seasonName")
    const seasonIndex = await getSeason(regionId, seasonName)
    const roster = playerIds && playerIds.length
        ? region.seasons[seasonIndex].players.filter((id) => playerIds.includes(id))
        : region.seasons[seasonIndex].players
    let i = 0
    for (const playerId of roster) {
        try {
            let player = await seasonFilter(regionId, seasonName, playerId)
            if (tournaments) {
                player = await tournamentFilter(player, region.gameId, tournaments)
            }
            i = i + 1
            let newPlayerH2H = {
                id: playerId,
            }
            for (let j = i; j < roster.length; j++) {
                let wins
                let losses
                let opponent
                try {
                    const gameIndex = await getGameFromPlayer(playerId, region.gameId)
                    opponent = await getPlayer(roster[j])
                    opponentIndex = player.games[gameIndex].opponents.findIndex(record => record.opponentId === roster[j])
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

// Elo and Glicko-2 are sequential: the order matches are applied changes the
// result. The h2h matrix only holds win/loss totals, so rating off it meant
// walking matches in JavaScript key order -- an arbitrary order that shifted
// ratings by up to ~80 (Elo) and ~190 (Glicko-2) points. This returns the same
// matches as one chronologically ordered list instead.
//
// completedAt is exact but only exists on rows written since it was added, so
// older rows fall back to the event's start time. setId breaks remaining ties
// so the order is always deterministic.
// Sets recorded before completedAt was stored have no per-set time, so ratings
// fall back to the event's start for them. This re-reads just the timestamps
// from start.gg and fills them in; it never creates or removes a set.
const backfillCompletedAt = async (playerId, videogameId, options = {}) => {
    const since = options.since ?? 0
    const maxPages = options.maxPages ?? 25
    const perPage = options.perPage ?? 200

    const query = `
    query SetTimes($id: ID!, $limit: Int!, $page: Int!, $updatedAfter: Timestamp!) {
        player(id: $id) {
            sets(perPage: $limit, page: $page, filters: {updatedAfter: $updatedAfter}) {
                pageInfo {
                    totalPages
                }
                nodes {
                    id
                    completedAt
                }
            }
        }
    }
    `

    const times = new Map()
    let page = 1
    let totalPages = null
    do {
        const response = await doRequest(query, playerId, videogameId, perPage, since, page)
        const sets = response.data && response.data.player && response.data.player.sets
        if (!sets || !sets.nodes || sets.nodes.length === 0) break
        totalPages = sets.pageInfo.totalPages
        for (const node of sets.nodes) {
            if (node.completedAt) times.set(Number(node.id), node.completedAt)
        }
        page = page + 1
    } while (page <= maxPages && (totalPages === null || page <= totalPages))

    const player = await getPlayer(playerId)
    const gameIndex = player.games.findIndex((game) => game.gameId === videogameId)
    if (gameIndex === -1) {
        return { fetched: times.size, rows: 0, alreadySet: 0, updated: 0, unmatched: 0 }
    }

    let rows = 0
    let alreadySet = 0
    let updated = 0
    let unmatched = 0
    for (const record of player.games[gameIndex].opponents || []) {
        for (const set of record.tournaments || []) {
            rows = rows + 1
            if (set.completedAt) {
                alreadySet = alreadySet + 1
                continue
            }
            const at = times.get(Number(set.setId))
            if (at) {
                set.completedAt = at
                updated = updated + 1
            } else {
                unmatched = unmatched + 1
            }
        }
    }
    if (updated > 0) {
        await editPlayer(playerId, player)
    }
    return { fetched: times.size, rows, alreadySet, updated, unmatched }
}

// seasonFilter is the expensive part of every season view, and the h2h matrix,
// the chronological match list and the per-player bracket counts each used to
// run it over the whole roster independently. This runs it once and hands the
// filtered players to everything that needs them.
const buildSeasonContext = async (regionId, seasonName, tournaments, playerIds) => {
    const region = await getRegion(regionId)
    const seasonIndex = await getSeason(regionId, seasonName)
    const roster = playerIds && playerIds.length
        ? region.seasons[seasonIndex].players.filter((id) => playerIds.includes(id))
        : region.seasons[seasonIndex].players

    const filtered = new Map()
    for (const playerId of roster) {
        try {
            let player = await seasonFilter(regionId, seasonName, playerId)
            if (tournaments && tournaments.length) {
                player = await tournamentFilter(player, region.gameId, tournaments)
            }
            filtered.set(playerId, player)
        } catch (e) {
            console.error(`season context: skipping ${playerId}:`, e)
        }
    }

    const present = roster.filter((id) => filtered.has(id))
    const gameIndexOf = (player) => player.games.findIndex((game) => game.gameId === region.gameId)

    // Triangular matrix, same shape do_h2h produces: each pair recorded once,
    // mirrored later by finish_h2h.
    const h2h = {}
    for (let i = 0; i < present.length; i++) {
        const player = filtered.get(present[i])
        const gameIndex = gameIndexOf(player)
        const entry = { id: present[i] }
        for (let j = i + 1; j < present.length; j++) {
            const opponentId = present[j]
            const opponentTag = filtered.get(opponentId).gamerTag
            let wins = 0
            let losses = 0
            if (gameIndex !== -1) {
                const record = player.games[gameIndex].opponents.find((r) => r.opponentId === opponentId)
                if (record) {
                    wins = record.tournaments.filter((t) => t.type === 'win').length
                    losses = record.tournaments.filter((t) => t.type === 'loss').length
                }
            }
            entry[opponentTag] = { wins, losses }
        }
        h2h[player.gamerTag] = entry
    }

    // eventId -> startAt, for sets stored before completedAt was recorded.
    const tournamentCollection = await tournaments_collection()
    const eventStart = new Map()
    for (const tournament of await tournamentCollection.find({}).toArray()) {
        for (const event of tournament.events || []) {
            eventStart.set(event.eventId, event.startAt)
        }
    }

    const onRoster = new Set(present)
    const bySetId = new Map()
    for (const playerId of present) {
        const player = filtered.get(playerId)
        const gameIndex = gameIndexOf(player)
        if (gameIndex === -1) continue
        for (const record of player.games[gameIndex].opponents || []) {
            if (!onRoster.has(record.opponentId)) continue
            for (const set of record.tournaments || []) {
                if (bySetId.has(set.setId)) continue
                bySetId.set(set.setId, {
                    setId: set.setId,
                    winnerId: set.type === 'win' ? playerId : record.opponentId,
                    loserId: set.type === 'win' ? record.opponentId : playerId,
                    at: set.completedAt ?? eventStart.get(set.eventId) ?? 0
                })
            }
        }
    }
    const matches = [...bySetId.values()]
    matches.sort((a, b) => a.at - b.at || a.setId - b.setId)
    for (const match of matches) {
        match.winner = filtered.get(match.winnerId) && filtered.get(match.winnerId).gamerTag
        match.loser = filtered.get(match.loserId) && filtered.get(match.loserId).gamerTag
    }

    return {
        region,
        roster: present,
        players: filtered,
        gameIndexOf,
        h2h,
        matches: matches.filter((m) => m.winner && m.loser)
    }
}

// Everything the season player list needs, in one request: identity, bracket
// count, ratings and main character. Previously the page made one request per
// player plus a separate ratings request, each re-running seasonFilter.
const getSeasonPlayerSummaries = async (regionId, seasonName, tournaments, playerIds) => {
    const context = await buildSeasonContext(regionId, seasonName, tournaments, playerIds)
    const rated = do_glicko2(do_elo(context.h2h, context.matches), context.matches)

    const byTag = new Map()
    for (const tag of Object.keys(rated)) byTag.set(rated[tag].id, rated[tag])

    const players = context.roster.map((playerId) => {
        const player = context.players.get(playerId)
        const gameIndex = context.gameIndexOf(player)
        const game = gameIndex === -1 ? null : player.games[gameIndex]
        const rating = byTag.get(playerId)

        let mainCharacter = null
        let mostPlays = 0
        for (const character of (game && game.characters) || []) {
            if (character.numOfPlays > mostPlays) {
                mostPlays = character.numOfPlays
                mainCharacter = character.characterName
            }
        }

        let wins = 0
        let losses = 0
        for (const record of (game && game.opponents) || []) {
            for (const set of record.tournaments || []) {
                if (set.type === 'win') wins = wins + 1
                else if (set.type === 'loss') losses = losses + 1
            }
        }

        return {
            _id: playerId,
            gamerTag: player.gamerTag,
            pfp: player.pfp,
            brackets: game ? game.tournaments.length : 0,
            wins: wins,
            losses: losses,
            mainCharacter: mainCharacter,
            elo: rating ? rating.elo : null,
            glicko: rating ? rating.rating : null,
            deviation: rating ? rating.deviation : null
        }
    })

    players.sort((a, b) => (b.glicko ?? -Infinity) - (a.glicko ?? -Infinity))
    return { region: context.region, players: players, matches: context.matches.length }
}

const getSeasonMatches = async (regionId, seasonName, tournaments, playerIds) => {
    const region = await getRegion(regionId)
    const seasonIndex = await getSeason(regionId, seasonName)
    const roster = playerIds && playerIds.length
        ? region.seasons[seasonIndex].players.filter((id) => playerIds.includes(id))
        : region.seasons[seasonIndex].players
    const onRoster = new Set(roster)

    // eventId -> startAt, read once rather than per set
    const tournamentCollection = await tournaments_collection()
    const eventStart = new Map()
    for (const tournament of await tournamentCollection.find({}).toArray()) {
        for (const event of tournament.events || []) {
            eventStart.set(event.eventId, event.startAt)
        }
    }

    const tagById = new Map()
    const bySetId = new Map()
    for (const playerId of roster) {
        let player
        try {
            player = await seasonFilter(regionId, seasonName, playerId)
            if (tournaments && tournaments.length) {
                player = await tournamentFilter(player, region.gameId, tournaments)
            }
        } catch (e) {
            continue
        }
        tagById.set(playerId, player.gamerTag)
        const gameIndex = player.games.findIndex((game) => game.gameId === region.gameId)
        if (gameIndex === -1) continue
        for (const record of player.games[gameIndex].opponents || []) {
            if (!onRoster.has(record.opponentId)) continue
            for (const set of record.tournaments || []) {
                // Each set appears in both players' records; keep one copy.
                if (bySetId.has(set.setId)) continue
                bySetId.set(set.setId, {
                    setId: set.setId,
                    winnerId: set.type === 'win' ? playerId : record.opponentId,
                    loserId: set.type === 'win' ? record.opponentId : playerId,
                    at: set.completedAt ?? eventStart.get(set.eventId) ?? 0
                })
            }
        }
    }

    const matches = [...bySetId.values()]
    matches.sort((a, b) => a.at - b.at || a.setId - b.setId)
    // Tags are what the h2h matrix is keyed by.
    for (const match of matches) {
        match.winner = tagById.get(match.winnerId)
        match.loser = tagById.get(match.loserId)
    }
    return matches.filter((match) => match.winner && match.loser)
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

// withCounts=false skips the roster-vs-roster tally, which costs a full
// seasonFilter pass. Callers that only need bracket names and dates opt out.
const getTournamentsBySeason = async (regionId, seasonName, withCounts = true) => {
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
                        nameOfBracket: `${tournament.tournamentName}: ${tournament.events[eventIndex].eventName}`,
                        tournamentName: tournament.tournamentName,
                        eventName: tournament.events[eventIndex].eventName,
                        pfp: tournament.pfp,
                        startAt: tournament.events[eventIndex].startAt,
                        entrants: tournament.events[eventIndex].entrants,
                        // Filled in below: how many of this event's sets are
                        // between two roster members, i.e. how much toggling it
                        // actually changes the chart. Most events contribute none.
                        sets: 0
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
        if (!withCounts) {
        results.sort((a, b) => (b.startAt || 0) - (a.startAt || 0))
        return results
    }

    // Count roster-vs-roster sets per event, deduped (each set is stored on
    // both players). Without this the filter lists 109 events when only ~45 can
    // change anything, and the other 64 look broken when toggled.
    const roster = new Set(region.seasons[seasonIndex].players)
    const byEvent = new Map()
    const seenSets = new Set()
    for (const playerId of roster) {
        let filtered
        try {
            filtered = await seasonFilter(regionId, seasonName, playerId)
        } catch (e) {
            continue
        }
        const index = filtered.games.findIndex((game) => game.gameId === region.gameId)
        if (index === -1) continue
        for (const record of filtered.games[index].opponents || []) {
            if (!roster.has(record.opponentId)) continue
            for (const set of record.tournaments || []) {
                if (seenSets.has(set.setId)) continue
                seenSets.add(set.setId)
                byEvent.set(set.eventId, (byEvent.get(set.eventId) || 0) + 1)
            }
        }
    }
    for (const result of results) {
        result.sets = byEvent.get(result.eventId) || 0
    }
    // Most recent first, and the events that matter above the ones that don't.
    results.sort((a, b) => b.sets - a.sets || (b.startAt || 0) - (a.startAt || 0))
    return results
}

const do_elo = (h2h, matches) => {
    if (!Array.isArray(matches)) {
        throw 'do_elo requires a chronological match list from getSeasonMatches'
    }
    // Every season starts level: a season's ratings come only from that
    // season's matches. This used to be a chain of per-player seeds hardcoded
    // by start.gg id -- a stale snapshot that matched no season in the data,
    // covered only some of the roster, and listed one id twice so the second
    // entry was unreachable.
    for (let player in h2h) {
        h2h[player].elo = 1500
    }
    function Probability(rating1, rating2) {
        return (
            (1.0 * 1.0) / (1 + 1.0 * Math.pow(10, (1.0 * (rating1 - rating2)) / 400))
        );
    }
    // Expected scores sum to 1, so the two updates cancel and the pool's total
    // rating is conserved.
    function applyResult(winner, loser, K) {
        const Rw = h2h[winner].elo
        const Rl = h2h[loser].elo
        const expectedWinner = Probability(Rl, Rw);
        const expectedLoser = Probability(Rw, Rl);
        h2h[winner].elo = Rw + K * (1 - expectedWinner);
        h2h[loser].elo = Rl + K * (0 - expectedLoser);
    }
    // Applied in match order. Grouping by opponent pair and walking object keys
    // made the result depend on key order rather than on what happened.
    for (const match of matches) {
        if (h2h[match.winner] === undefined || h2h[match.loser] === undefined) continue
        applyResult(match.winner, match.loser, 30);
    }
    return h2h
}

// Glicko-2, per Glickman's specification.
//
// The algorithm is defined over *rating periods*: you collect every game a
// player played in a period and update once from their rating at the start of
// it. This used to call the update once per set, which made a player's rating
// depend on their own earlier games within the same period, collapsed RD
// monotonically, and discarded the volatility it had just computed.
//
// Default period = the whole season. Glickman targets roughly 10-15 games per
// player per period; over a season these players average 15 (min 7, max 52),
// whereas 30-day periods would give ~6 and weekly ~3 -- too sparse to estimate
// from. Pass periodDays to subdivide if a season ever gets busy enough.
const GLICKO_SCALE = 173.7178
const GLICKO_TAU = 0.5          // system constant: smaller = less volatile
const GLICKO_EPSILON = 0.000001

const do_glicko2 = (h2h, matches, options = {}) => {
    if (!Array.isArray(matches)) {
        throw 'do_glicko2 requires a chronological match list from getSeasonMatches'
    }
    const periodDays = options.periodDays ?? 0

    const g = (deviation) => 1 / Math.sqrt(1 + (3 * deviation * deviation) / (Math.PI * Math.PI))
    const E = (rating, opponentRating, opponentDeviation) =>
        1 / (1 + Math.exp(-g(opponentDeviation) * (rating - opponentRating)))

    // Solves for the new volatility (Illinois variant of regula falsi).
    const newVolatility = (delta, phi, v, sigma) => {
        const deltaSq = delta * delta
        const phiSq = phi * phi
        const tauSq = GLICKO_TAU * GLICKO_TAU
        const a = Math.log(sigma * sigma)
        const f = (x) => {
            const ex = Math.exp(x)
            const numerator = ex * (deltaSq - phiSq - v - ex)
            const denominator = 2 * Math.pow(phiSq + v + ex, 2)
            return (numerator / denominator) - ((x - a) / tauSq)
        }

        let A = a
        let B
        if (deltaSq > phiSq + v) {
            B = Math.log(deltaSq - phiSq - v)
        } else {
            let k = 1
            while (f(a - k * GLICKO_TAU) < 0) k = k + 1
            B = a - k * GLICKO_TAU
        }

        let fA = f(A)
        let fB = f(B)
        let guard = 0
        while (Math.abs(B - A) > GLICKO_EPSILON && guard < 100) {
            const C = A + ((A - B) * fA) / (fB - fA)
            const fC = f(C)
            if (fC * fB <= 0) {
                A = B
                fA = fB
            } else {
                fA = fA / 2
            }
            B = C
            fB = fC
            guard = guard + 1
        }
        return Math.exp(A / 2)
    }

    // Everyone starts at the Glicko-2 default, on the internal scale.
    const state = {}
    for (const player in h2h) {
        state[player] = { rating: 0, deviation: 350 / GLICKO_SCALE, volatility: 0.06 }
    }

    // Bucket matches into rating periods. periodDays = 0 means one period.
    const periods = new Map()
    const firstAt = matches.length ? matches[0].at : 0
    for (const match of matches) {
        const index = periodDays > 0
            ? Math.floor((match.at - firstAt) / (periodDays * 86400))
            : 0
        if (!periods.has(index)) periods.set(index, [])
        periods.get(index).push(match)
    }

    for (const index of [...periods.keys()].sort((a, b) => a - b)) {
        // Every player in a period is rated against the others' ratings as they
        // stood at the start of it, so results inside a period are simultaneous.
        const before = {}
        for (const player in state) before[player] = { ...state[player] }

        const games = {}
        for (const match of periods.get(index)) {
            if (!state[match.winner] || !state[match.loser]) continue
            if (!games[match.winner]) games[match.winner] = []
            if (!games[match.loser]) games[match.loser] = []
            games[match.winner].push({ opponent: match.loser, score: 1 })
            games[match.loser].push({ opponent: match.winner, score: 0 })
        }

        for (const player in state) {
            const played = games[player]
            const self = before[player]

            if (!played || played.length === 0) {
                // Idle players keep their rating but grow less certain, which is
                // the step the old code defined as decay() and never called.
                state[player].deviation = Math.sqrt(
                    self.deviation * self.deviation + self.volatility * self.volatility
                )
                continue
            }

            let invV = 0
            let deltaSum = 0
            for (const game of played) {
                const opponent = before[game.opponent]
                const gPhi = g(opponent.deviation)
                const expected = E(self.rating, opponent.rating, opponent.deviation)
                invV += gPhi * gPhi * expected * (1 - expected)
                deltaSum += gPhi * (game.score - expected)
            }
            const v = 1 / invV
            const delta = v * deltaSum

            const volatility = newVolatility(delta, self.deviation, v, self.volatility)
            const phiStar = Math.sqrt(self.deviation * self.deviation + volatility * volatility)
            const deviation = 1 / Math.sqrt(1 / (phiStar * phiStar) + invV)

            state[player].rating = self.rating + deviation * deviation * deltaSum
            state[player].deviation = deviation
            state[player].volatility = volatility
        }
    }

    for (const player in h2h) {
        h2h[player].rating = state[player].rating * GLICKO_SCALE + 1500
        h2h[player].deviation = state[player].deviation * GLICKO_SCALE
        // The computed volatility is kept now; it used to be overwritten with
        // the 0.06 starting value for every player.
        h2h[player].volatility = state[player].volatility
    }
    return h2h
}

export {
    refreshGamerTag,
    buildSeasonContext,
    getSeasonPlayerSummaries,
    backfillCompletedAt,
    getSeasonMatches,
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