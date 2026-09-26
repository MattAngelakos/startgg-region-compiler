import { gqlRequest } from '../startgg.js'
import { getRegion } from './regions.js'
import { getSeason } from './seasons.js'

// Strips series numbering so "Fusion #311" and "Fusion #312" count as one
// recurring event, matching reduceEventNames in playerData.js.
const seriesName = (name) => {
    let cleaned = name.split(/[#\d-]/)[0].trim()
    return cleaned.replace(/(?: [IVXLCDM]+)?$/, '').trim()
}

const TOURNAMENTS_QUERY = `
query RegionTournaments($state: String!, $videogameId: ID!, $after: Timestamp!, $before: Timestamp!, $page: Int!) {
    tournaments(query: {
        perPage: 40,
        page: $page,
        filter: {
            addrState: $state,
            videogameIds: [$videogameId],
            afterDate: $after,
            beforeDate: $before,
            past: true
        }
    }) {
        pageInfo { totalPages total }
        nodes {
            id
            name
            startAt
            addrState
            events(filter: {videogameId: [$videogameId]}) {
                id
                name
                type
                isOnline
                numEntrants
            }
        }
    }
}`

const STANDINGS_QUERY = `
query EventStandings($eventId: ID!, $page: Int!) {
    event(id: $eventId) {
        standings(query: {perPage: 60, page: $page}) {
            pageInfo { totalPages }
            nodes {
                placement
                entrant { participants { gamerTag player { id } } }
            }
        }
    }
}`

// Every event in the region's state during the season that meets the region's
// entrant/online rules. One cheap request per 40 tournaments.
const findSeasonEvents = async (region, season) => {
    const events = []
    let page = 1
    let totalPages = 1
    do {
        const body = await gqlRequest(TOURNAMENTS_QUERY, {
            state: region.addrState,
            videogameId: region.gameId,
            after: season.startDate,
            before: season.endDate,
            page: page
        })
        const connection = body.data && body.data.tournaments
        if (!connection) break
        totalPages = connection.pageInfo.totalPages
        for (const tournament of connection.nodes || []) {
            for (const event of tournament.events || []) {
                if (event.type !== 1) continue
                if (!region.onlineAllowed && event.isOnline) continue
                if ((event.numEntrants || 0) < region.minimumEntrants) continue
                events.push({
                    eventId: event.id,
                    eventName: event.name,
                    tournamentId: tournament.id,
                    tournamentName: tournament.name,
                    series: seriesName(tournament.name),
                    startAt: tournament.startAt,
                    addrState: tournament.addrState,
                    numEntrants: event.numEntrants
                })
            }
        }
        page = page + 1
    } while (page <= totalPages)
    return events
}

const entrantsForEvent = async (eventId) => {
    const entrants = []
    let page = 1
    let totalPages = 1
    do {
        const body = await gqlRequest(STANDINGS_QUERY, { eventId: eventId, page: page })
        const standings = body.data && body.data.event && body.data.event.standings
        if (!standings) break
        totalPages = standings.pageInfo.totalPages
        for (const node of standings.nodes || []) {
            const participant = node.entrant && node.entrant.participants && node.entrant.participants[0]
            if (!participant || !participant.player || participant.player.id == null) continue
            entrants.push({
                playerId: Number(participant.player.id),
                gamerTag: participant.gamerTag,
                placement: node.placement
            })
        }
        page = page + 1
    } while (page <= totalPages)
    return entrants
}

// Builds the season roster straight from start.gg: who actually played
// qualifying events in the region, and which of them clear the region's
// thresholds. Replaces collecting player ids by hand.
const discoverSeasonPlayers = async (regionId, seasonName, options = {}) => {
    const region = await getRegion(regionId)
    const seasonIndex = await getSeason(regionId, seasonName)
    const season = region.seasons[seasonIndex]

    const events = await findSeasonEvents(region, season)
    if (options.onProgress) {
        options.onProgress(`found ${events.length} qualifying event(s) in ${region.addrState}`)
    }

    const byPlayer = new Map()
    let done = 0
    for (const event of events) {
        let entrants
        try {
            entrants = await entrantsForEvent(event.eventId)
        } catch (e) {
            console.warn(`skipping event ${event.eventId} (${event.eventName}): ${e.message || e}`)
            continue
        }
        for (const entrant of entrants) {
            let record = byPlayer.get(entrant.playerId)
            if (!record) {
                record = {
                    playerId: entrant.playerId,
                    gamerTag: entrant.gamerTag,
                    events: 0,
                    eventsInState: 0,
                    series: new Set(),
                    bestPlacement: Infinity
                }
                byPlayer.set(entrant.playerId, record)
            }
            record.events += 1
            if (event.addrState === region.addrState) record.eventsInState += 1
            record.series.add(event.series)
            if (entrant.placement && entrant.placement < record.bestPlacement) {
                record.bestPlacement = entrant.placement
            }
        }
        done = done + 1
        if (options.onProgress && done % 10 === 0) {
            options.onProgress(`read standings for ${done}/${events.length} events`)
        }
    }

    const candidates = [...byPlayer.values()].map((record) => {
        const uniqueSeries = record.series.size
        return {
            playerId: record.playerId,
            gamerTag: record.gamerTag,
            events: record.events,
            eventsInState: record.eventsInState,
            uniqueSeries: uniqueSeries,
            bestPlacement: record.bestPlacement === Infinity ? null : record.bestPlacement,
            eligible:
                record.events >= region.minimumEvents &&
                record.eventsInState >= region.minimumEventsInAddrState &&
                uniqueSeries >= region.minimumUniqueEvents
        }
    })

    candidates.sort((a, b) => b.events - a.events || a.gamerTag.localeCompare(b.gamerTag))
    return { region: region, season: season, events: events, candidates: candidates }
}

export { discoverSeasonPlayers, findSeasonEvents, entrantsForEvent, seriesName }
