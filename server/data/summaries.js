import { players, tournaments } from '../config/mongoCollections.js'
import { getRegion } from './regions.js'

// The season list needs counts and the names its search boxes filter on. Doing
// that per player and per tournament over HTTP costs thousands of round trips,
// so build every season's summary from two collection reads instead.
const getRegionSeasonSummaries = async (regionId) => {
    const region = await getRegion(regionId)

    const playerIds = [...new Set((region.seasons || []).flatMap((s) => s.players || []))]
    const playerCollection = await players()
    const playerDocs = playerIds.length
        ? await playerCollection.find({ _id: { $in: playerIds } }).toArray()
        : []
    const playerById = new Map(playerDocs.map((p) => [p._id, p]))

    // eventId -> {startAt, entrants, isOnline, tournamentName}
    const tournamentCollection = await tournaments()
    const eventIndex = new Map()
    for (const tournament of await tournamentCollection.find({}).toArray()) {
        for (const event of tournament.events || []) {
            eventIndex.set(event.eventId, {
                startAt: event.startAt,
                entrants: event.entrants,
                isOnline: event.isOnline,
                videogameId: event.videogameId,
                tournamentName: tournament.tournamentName
            })
        }
    }

    const summaries = (region.seasons || []).map((season) => {
        let tournamentCount = 0
        const playerTags = []
        const tournamentNames = new Set()
        const uniqueEvents = new Set()

        for (const playerId of season.players || []) {
            const player = playerById.get(playerId)
            if (!player) continue
            playerTags.push(player.gamerTag)
            const game = (player.games || []).find((g) => g.gameId === region.gameId)
            if (!game) continue
            for (const entry of game.tournaments || []) {
                const event = eventIndex.get(entry.eventId)
                if (!event) continue
                // Same rules seasonFilter applies, evaluated in memory.
                if (event.startAt < season.startDate || event.startAt >= season.endDate) continue
                if (!region.onlineAllowed && event.isOnline) continue
                if ((event.entrants || 0) < region.minimumEntrants) continue
                tournamentCount = tournamentCount + 1
                uniqueEvents.add(entry.eventId)
                tournamentNames.add(event.tournamentName)
            }
        }

        return {
            seasonName: season.seasonName,
            startDate: season.startDate,
            endDate: season.endDate,
            gameId: region.gameId,
            playerCount: (season.players || []).length,
            tournamentCount: tournamentCount,
            uniqueTournamentCount: uniqueEvents.size,
            playerTags: playerTags,
            tournamentNames: [...tournamentNames]
        }
    })

    return { region: region, seasons: summaries }
}

export { getRegionSeasonSummaries }
