import { closeConnection } from '../config/mongoConnection.js'
import { getAllRegions, getRegion } from '../data/regions.js'
import { createSeason, getSeason, addPlayers, editSeason } from '../data/seasons.js'
import { createPlayer, createGameForPlayer, getPlayer, getGameFromPlayer } from '../data/players.js'
import { setsRequest, refreshGamerTag, backfillCompletedAt } from '../data/playerData.js'
import { discoverSeasonPlayers } from '../data/roster.js'

const usage = `
Usage:
  node scripts/season.js list
  node scripts/season.js create   <region> <season>            e.g. create NJ q3_2026
  node scripts/season.js discover <region> <season> [--write] [--all] [--min-events N]
  node scripts/season.js roster   <region> <season> --ids <id,id,...> [--remove]
  node scripts/season.js sync     <region> <season> [--full] [--only <id,id>] [--no-refresh]
  node scripts/season.js refresh  <region> <season>
  node scripts/season.js timestamps <region> <season> [--all] [--only <id,id>]

Flags:
  --ids          explicit player ids for a hand-picked roster (roster command)
  --remove       with roster: take those ids off the season instead of adding them
  --all          with timestamps: backfill a player's whole history, not just this season
  --write        add the discovered players to the season (creates missing player records)
  --all          include players who do not meet the region's thresholds
  --min-events N override the region's minimumEvents for this run
  --full         ignore the season window and resync a player's whole history
  --only         sync just these player ids
  --no-refresh   skip the gamerTag/pfp refresh that sync does by default
`

// "q3_2026" -> Jul 1 2026 through Oct 1 2026 (exclusive), i.e. Jul 1 - Sep 30.
const quarterDates = (seasonName) => {
    const match = /^q([1-4])_(\d{4})$/i.exec(seasonName.trim())
    if (!match) throw `season name "${seasonName}" is not in qN_YYYY form; pass dates manually`
    const quarter = Number(match[1])
    const year = Number(match[2])
    const startMonth = (quarter - 1) * 3 + 1
    const endMonth = startMonth + 3
    return {
        startYear: year,
        startMonth: startMonth,
        startDay: 1,
        endYear: endMonth > 12 ? year + 1 : year,
        endMonth: endMonth > 12 ? endMonth - 12 : endMonth,
        endDay: 1
    }
}

const findRegion = async (name) => {
    const all = await getAllRegions()
    const match = all.find((r) => r.regionName.toLowerCase() === name.toLowerCase())
    if (!match) throw `no region named "${name}" (have: ${all.map((r) => r.regionName).join(', ')})`
    return await getRegion(match._id.toString())
}

const flagValue = (args, name) => {
    const index = args.indexOf(name)
    return index === -1 ? null : args[index + 1]
}

const day = (ts) => new Date(ts * 1000).toISOString().slice(0, 10)

const cmdList = async () => {
    for (const region of await getAllRegions()) {
        console.log(`${region.regionName}  (${region._id.toString()})  game ${region.gameId}  min ${region.minimumEntrants} entrants`)
        for (const season of region.seasons || []) {
            console.log(`   ${season.seasonName.padEnd(10)} ${day(season.startDate)} -> ${day(season.endDate)}  ${(season.players || []).length} players`)
        }
    }
}

const cmdCreate = async (regionName, seasonName) => {
    const region = await findRegion(regionName)
    const d = quarterDates(seasonName)
    const season = await createSeason(
        region._id.toString(), seasonName,
        d.startYear, d.startMonth, d.startDay,
        d.endYear, d.endMonth, d.endDay
    )
    console.log(`created ${seasonName} for ${region.regionName}: ${day(season.startDate)} -> ${day(season.endDate)} (last day ${day(season.endDate - 86400)})`)
}

// addPlayers() silently skips ids with no player document, so the records have
// to exist before the roster is written.
const ensurePlayer = async (playerId, gameId, fallbackTag) => {
    let tag = fallbackTag
    try {
        tag = (await getPlayer(playerId)).gamerTag
    } catch (e) {
        const created = await createPlayer(playerId, fallbackTag)
        tag = created.gamerTag
        console.log(`  created player ${tag} (${playerId})`)
    }
    try {
        await getGameFromPlayer(playerId, gameId)
    } catch (e) {
        await createGameForPlayer(playerId, gameId)
        console.log(`  added game ${gameId} for ${tag} (${playerId})`)
    }
    return tag
}

const cmdRoster = async (regionName, seasonName, args) => {
    const region = await findRegion(regionName)
    const raw = flagValue(args, '--ids')
    if (!raw) throw 'roster needs --ids <id,id,...>'
    const ids = raw.split(',').map((s) => Number(s.trim())).filter((n) => Number.isInteger(n))

    const regionId = region._id.toString()

    if (args.includes('--remove')) {
        const seasonIndex = await getSeason(regionId, seasonName)
        const current = region.seasons[seasonIndex].players || []
        const removing = ids.filter((id) => current.includes(id))
        const notOnRoster = ids.filter((id) => !current.includes(id))
        for (const id of removing) {
            let tag = String(id)
            try {
                tag = (await getPlayer(id)).gamerTag
            } catch (e) { /* removal does not need the record to exist */ }
            console.log(`  removing ${tag} (${id})`)
        }
        for (const id of notOnRoster) console.log(`  ${id} was not on the roster, skipping`)
        // Player documents are left alone: they may belong to other seasons,
        // and their match history is still referenced as opponent data.
        await editSeason(regionId, seasonName, {
            players: current.filter((id) => !ids.includes(id))
        })
        const after = await getRegion(regionId)
        console.log(`\n${seasonName} is now ${after.seasons[seasonIndex].players.length} players (${removing.length} removed)`)
        return
    }

    console.log(`adding ${ids.length} players to ${region.regionName} ${seasonName}`)
    for (const id of ids) await ensurePlayer(id, region.gameId, undefined)

    const seasonIndex = await getSeason(regionId, seasonName)
    const fresh = await getRegion(regionId)
    const existing = new Set(fresh.seasons[seasonIndex].players || [])
    const toAdd = ids.filter((id) => !existing.has(id))
    await addPlayers(regionId, seasonName, toAdd)

    const after = await getRegion(regionId)
    console.log(`\nroster for ${seasonName} is now ${after.seasons[seasonIndex].players.length} players (${toAdd.length} added, ${ids.length - toAdd.length} already present)`)
}

const cmdDiscover = async (regionName, seasonName, args) => {
    const region = await findRegion(regionName)
    const minEvents = flagValue(args, '--min-events')
    if (minEvents !== null) region.minimumEvents = Number(minEvents)

    const result = await discoverSeasonPlayers(region._id.toString(), seasonName, {
        onProgress: (message) => console.log(`  ${message}`)
    })

    const shown = args.includes('--all') ? result.candidates : result.candidates.filter((c) => c.eligible)
    console.log(`\n${result.events.length} qualifying events, ${result.candidates.length} players seen, ${result.candidates.filter((c) => c.eligible).length} eligible`)
    console.log(`(thresholds: ${region.minimumEvents}+ events, ${region.minimumEventsInAddrState}+ in ${region.addrState}, ${region.minimumUniqueEvents}+ distinct series)\n`)
    console.log('  id'.padEnd(12) + 'tag'.padEnd(24) + 'events  inState  series  best')
    for (const c of shown) {
        console.log(
            '  ' + String(c.playerId).padEnd(10) +
            c.gamerTag.slice(0, 22).padEnd(24) +
            String(c.events).padEnd(8) + String(c.eventsInState).padEnd(9) +
            String(c.uniqueSeries).padEnd(8) + String(c.bestPlacement ?? '-') +
            (c.eligible ? '' : '   (below threshold)')
        )
    }
    console.log(`\nplayer ids: [${shown.map((c) => c.playerId).join(', ')}]`)

    if (!args.includes('--write')) {
        console.log('\n(dry run - pass --write to add these players to the season)')
        return
    }

    console.log(`\nadding ${shown.length} players to ${seasonName}...`)
    for (const c of shown) await ensurePlayer(c.playerId, region.gameId, c.gamerTag)
    const regionId = region._id.toString()
    const seasonIndex = await getSeason(regionId, seasonName)
    const fresh = await getRegion(regionId)
    const existing = new Set(fresh.seasons[seasonIndex].players || [])
    const toAdd = shown.map((c) => c.playerId).filter((id) => !existing.has(id))
    await addPlayers(regionId, seasonName, toAdd)
    console.log(`added ${toAdd.length} new players (${existing.size} already on the roster)`)
}

const cmdRefresh = async (regionName, seasonName, args) => {
    const region = await findRegion(regionName)
    const seasonIndex = await getSeason(region._id.toString(), seasonName)
    const playerIds = region.seasons[seasonIndex].players || []
    console.log(`refreshing tags for ${playerIds.length} players in ${region.regionName} ${seasonName}`)
    const changed = []
    let pfpOnly = 0
    for (const playerId of playerIds) {
        try {
            const change = await refreshGamerTag(playerId)
            if (change && change.tagChanged) {
                changed.push(change)
                console.log(`  ${change.from} -> ${change.to} (${change.playerId})`)
            } else if (change) {
                pfpOnly = pfpOnly + 1
            }
        } catch (e) {
            console.log(`  ${playerId}: ${e.message || e}`)
        }
    }
    console.log(`\n${changed.length} tag(s) changed, ${pfpOnly} avatar-only update(s), ${playerIds.length} checked`)
}

// Fills in per-set completedAt on rows written before it was stored, so the
// ratings can order matches exactly instead of falling back to event start.
const cmdTimestamps = async (regionName, seasonName, args) => {
    const region = await findRegion(regionName)
    const regionId = region._id.toString()
    const seasonIndex = await getSeason(regionId, seasonName)
    const season = region.seasons[seasonIndex]

    const only = flagValue(args, '--only')
    const playerIds = only ? only.split(',').map((s) => Number(s.trim())) : season.players || []
    if (playerIds.length === 0) {
        console.log(`${seasonName} has no players yet`)
        return
    }

    const since = args.includes('--all') ? 0 : season.startDate
    console.log(`backfilling set times for ${playerIds.length} players in ${region.regionName} ${seasonName}`)
    console.log(`window: ${args.includes('--all') ? 'full history' : day(season.startDate) + ' -> ' + day(season.endDate)}\n`)

    const started = Date.now()
    let totalUpdated = 0
    let totalUnmatched = 0
    const failures = []
    for (let i = 0; i < playerIds.length; i++) {
        const playerId = playerIds[i]
        let tag = String(playerId)
        try {
            tag = (await getPlayer(playerId)).gamerTag
        } catch (e) { /* the id is enough to report on */ }
        process.stdout.write(`[${i + 1}/${playerIds.length}] ${tag} (${playerId}) ... `)
        try {
            const result = await backfillCompletedAt(playerId, region.gameId, { since: since })
            totalUpdated += result.updated
            totalUnmatched += result.unmatched
            console.log(`${result.updated} filled, ${result.alreadySet} already set, ${result.unmatched} outside window`)
        } catch (e) {
            console.log(`FAILED: ${e.message || e}`)
            failures.push({ playerId, tag, error: e.message || String(e) })
        }
    }
    const minutes = ((Date.now() - started) / 60000).toFixed(1)
    console.log(`\ndone in ${minutes} min: ${totalUpdated} set times filled in, ${failures.length} failure(s)`)
    for (const f of failures) console.log(`  ${f.tag} (${f.playerId}): ${f.error}`)
}

const cmdSync = async (regionName, seasonName, args) => {
    const region = await findRegion(regionName)
    const seasonIndex = await getSeason(region._id.toString(), seasonName)
    const season = region.seasons[seasonIndex]

    const only = flagValue(args, '--only')
    let playerIds = only ? only.split(',').map((s) => Number(s.trim())) : season.players || []
    if (playerIds.length === 0) {
        console.log(`${seasonName} has no players yet - run "discover ${regionName} ${seasonName} --write" first`)
        return
    }

    // Only ask start.gg for sets touched since the season opened. This is the
    // difference between a few pages per player and a player's whole career.
    const since = args.includes('--full') ? 0 : season.startDate
    console.log(`syncing ${playerIds.length} players for ${region.regionName} ${seasonName}`)
    console.log(`window: ${args.includes('--full') ? 'full history' : day(season.startDate) + ' -> ' + day(season.endDate)}\n`)

    const started = Date.now()
    const failures = []
    for (let i = 0; i < playerIds.length; i++) {
        const playerId = playerIds[i]
        let tag = String(playerId)
        try {
            tag = (await getPlayer(playerId)).gamerTag
        } catch (e) { /* not stored yet; the id is enough to report on */ }
        // Refresh first so progress lines and later reports use the current tag.
        if (!args.includes('--no-refresh')) {
            try {
                const change = await refreshGamerTag(playerId)
                if (change && change.tagChanged) {
                    console.log(`  tag updated: ${change.from} -> ${change.to}`)
                    tag = change.to
                } else if (change) {
                    tag = change.to
                }
            } catch (e) {
                console.log(`  tag refresh failed for ${playerId}: ${e.message || e}`)
            }
        }
        process.stdout.write(`[${i + 1}/${playerIds.length}] ${tag} (${playerId}) ... `)
        try {
            const result = await setsRequest(playerId, region.gameId, {
                since: since,
                ignoreWatermark: args.includes('--full')
            })
            console.log(result || 'no new sets')
        } catch (e) {
            console.log(`FAILED: ${e.message || e}`)
            failures.push({ playerId, tag, error: e.message || String(e) })
        }
    }
    const minutes = ((Date.now() - started) / 60000).toFixed(1)
    console.log(`\ndone in ${minutes} min, ${failures.length} failure(s)`)
    for (const f of failures) console.log(`  ${f.tag} (${f.playerId}): ${f.error}`)
}

const main = async () => {
    const args = process.argv.slice(2)
    const [command, regionName, seasonName] = args
    switch (command) {
        case 'list': await cmdList(); break
        case 'create': await cmdCreate(regionName, seasonName); break
        case 'roster': await cmdRoster(regionName, seasonName, args); break
        case 'discover': await cmdDiscover(regionName, seasonName, args); break
        case 'refresh': await cmdRefresh(regionName, seasonName, args); break
        case 'timestamps': await cmdTimestamps(regionName, seasonName, args); break
        case 'sync': await cmdSync(regionName, seasonName, args); break
        default: console.log(usage)
    }
}

try {
    await main()
} catch (e) {
    console.error('\nerror:', e)
    process.exitCode = 1
} finally {
    await closeConnection()
}
