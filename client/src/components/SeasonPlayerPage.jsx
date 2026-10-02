import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from './Header';
import LoadingScreen from './LoadingScreen';
import { formatDate } from '../helpers';

// One player's season: the brackets they entered, their record against each
// opponent, and the characters they used. Everything here is season-scoped by
// the server's seasonFilter, not career totals.
const SeasonPlayerPage = () => {
    const { regionId, seasonName, playerId } = useParams();
    const [region, setRegion] = useState(null);
    const [player, setPlayer] = useState(null);
    const [events, setEvents] = useState(new Map());
    const [characterIcons, setCharacterIcons] = useState(null);
    const [rating, setRating] = useState(null);
    const [sortKey, setSortKey] = useState('date');

    useEffect(() => {
        // Clear first: navigating between players reuses this component, and
        // without this the previous player's stats sit under the new URL until
        // the fetch resolves.
        setPlayer(null);
        setRating(null);
        let cancelled = false;
        const load = async () => {
            try {
                const regionResponse = await fetch(`/regions/${regionId}`);
                if (!regionResponse.ok) throw new Error('Failed to fetch region');
                const regionData = (await regionResponse.json()).region;
                if (cancelled) return;
                setRegion(regionData);

                const [playerResponse, tournamentResponse, iconResponse] = await Promise.all([
                    fetch(`/regions/${regionId}/seasons/${seasonName}/players/${playerId}`),
                    // only bracket names and dates are needed here, not the set tallies
                    fetch(`/regions/${regionId}/seasons/${seasonName}/tournaments?counts=0`),
                    fetch(`/games/${regionData.gameId}/characters`)
                ]);
                if (!playerResponse.ok) throw new Error('Failed to fetch player');
                if (cancelled) return;
                setPlayer((await playerResponse.json()).player);

                if (tournamentResponse.ok && !cancelled) {
                    const results = (await tournamentResponse.json()).results || [];
                    setEvents(new Map(results.map((t) => [t.eventId, t])));
                }
                if (iconResponse.ok && !cancelled) {
                    setCharacterIcons((await iconResponse.json()).characters);
                }
            } catch (error) {
                console.error('Error loading player season:', error);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [regionId, seasonName, playerId]);

    // Ratings are the slow part, so they load on their own and fill in rather
    // than holding up the whole page.
    useEffect(() => {
        let cancelled = false;
        const loadRating = async () => {
            try {
                const response = await fetch(`/regions/${regionId}/seasons/${seasonName}/stats/head-to-head`);
                if (!response.ok) throw new Error('Failed to fetch ratings');
                const h2h = (await response.json()).h2h || {};
                const entry = Object.values(h2h).find((e) => e.id === parseInt(playerId));
                if (entry && !cancelled) setRating({ elo: entry.elo, glicko: entry.rating, deviation: entry.deviation });
            } catch (error) {
                console.error('Error loading ratings:', error);
            }
        };
        loadRating();
        return () => { cancelled = true; };
    }, [regionId, seasonName, playerId]);

    const game = useMemo(
        () => (player && region ? player.games.find((g) => g.gameId === region.gameId) : null),
        [player, region]
    );

    const record = useMemo(() => {
        if (!game) return { wins: 0, losses: 0, opponents: [] };
        let wins = 0;
        let losses = 0;
        const opponents = [];
        for (const entry of game.opponents || []) {
            const w = entry.tournaments.filter((t) => t.type === 'win').length;
            const l = entry.tournaments.filter((t) => t.type === 'loss').length;
            wins += w;
            losses += l;
            opponents.push({ name: entry.opponentName, id: entry.opponentId, wins: w, losses: l });
        }
        opponents.sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses) || b.wins - a.wins);
        return { wins, losses, opponents };
    }, [game]);

    const brackets = useMemo(() => {
        if (!game) return [];
        const rows = (game.tournaments || []).map((t) => {
            const event = events.get(t.eventId);
            return {
                eventId: t.eventId,
                placement: t.placement,
                name: event ? event.nameOfBracket : `Event ${t.eventId}`,
                startAt: event ? event.startAt : 0,
                entrants: event ? event.entrants : null
            };
        });
        if (sortKey === 'placement') rows.sort((a, b) => a.placement - b.placement);
        else if (sortKey === 'entrants') rows.sort((a, b) => (b.entrants || 0) - (a.entrants || 0));
        else rows.sort((a, b) => (b.startAt || 0) - (a.startAt || 0));
        return rows;
    }, [game, events, sortKey]);

    const characters = useMemo(() => {
        if (!game) return [];
        return [...(game.characters || [])].sort((a, b) => b.numOfPlays - a.numOfPlays).slice(0, 6);
    }, [game]);

    if (!player || !region) {
        return <LoadingScreen label="Loading player season…" rows={4} link={`/regions/${regionId}/seasons/${seasonName}/players`} linkname={seasonName} />;
    }

    const winrate = record.wins + record.losses > 0
        ? Math.round((100 * record.wins) / (record.wins + record.losses))
        : null;

    return (
        <div className="app">
            <Header link={`/regions/${regionId}/seasons/${seasonName}/players`} linkname={seasonName} />
            <main>
                <div className="player-header">
                    {player.pfp && player.pfp !== 'N/A' && (
                        <img src={player.pfp} alt={player.gamerTag} className="player-header-pfp" />
                    )}
                    <div>
                        <h1>{player.gamerTag}</h1>
                        <div className="player-header-meta">
                            {region.regionName} · {seasonName}
                        </div>
                    </div>
                </div>

                <div className="stat-row">
                    <div className="stat">
                        <span className="stat-label">Glicko-2</span>
                        <span className="stat-value">
                            {rating ? rating.glicko.toFixed(1) : '…'}
                            {rating && <span className="stat-sub"> ±{rating.deviation.toFixed(0)}</span>}
                        </span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">Elo</span>
                        <span className="stat-value">{rating ? rating.elo.toFixed(1) : '…'}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">Brackets</span>
                        <span className="stat-value">{brackets.length}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">Sets</span>
                        <span className="stat-value">
                            {record.wins}&ndash;{record.losses}
                            {winrate !== null && <span className="stat-sub"> {winrate}%</span>}
                        </span>
                    </div>
                </div>

                {characters.length > 0 && (
                    <section className="player-section">
                        <h2>Characters</h2>
                        <div className="character-row">
                            {characters.map((c) => {
                                const icon = characterIcons && characterIcons[c.characterName]
                                    ? characterIcons[c.characterName].stockIcon
                                    : null;
                                return (
                                    <div className="character-chip" key={c.characterName}>
                                        {icon && <img src={icon} alt={c.characterName} className="character-icon" />}
                                        <span>{c.characterName}</span>
                                        <span className="character-plays">{c.numOfPlays}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="section-note">Game counts are career totals, not season-only.</p>
                    </section>
                )}

                <section className="player-section">
                    <div className="section-head">
                        <h2>Brackets ({brackets.length})</h2>
                        <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                            <option value="date">Most recent</option>
                            <option value="placement">Best placement</option>
                            <option value="entrants">Largest</option>
                        </select>
                    </div>
                    <table className="season-table">
                        <thead>
                            <tr><th>Date</th><th>Bracket</th><th>Placement</th><th>Entrants</th></tr>
                        </thead>
                        <tbody>
                            {brackets.map((b) => (
                                <tr key={b.eventId}>
                                    <td>{b.startAt ? formatDate(new Date(b.startAt * 1000)) : '—'}</td>
                                    <td className="cell-name">{b.name}</td>
                                    <td>{b.placement}</td>
                                    <td>{b.entrants ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="player-section">
                    <h2>Record ({record.opponents.length} opponents)</h2>
                    <table className="season-table">
                        <thead>
                            <tr><th>Opponent</th><th>W</th><th>L</th><th>Sets</th></tr>
                        </thead>
                        <tbody>
                            {record.opponents.map((o) => (
                                <tr key={o.id}>
                                    <td className="cell-name">
                                        <Link to={`/regions/${regionId}/seasons/${seasonName}/players/${o.id}`}>{o.name}</Link>
                                    </td>
                                    <td className={o.wins > o.losses ? 'cell-win' : ''}>{o.wins}</td>
                                    <td className={o.losses > o.wins ? 'cell-loss' : ''}>{o.losses}</td>
                                    <td>{o.wins + o.losses}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </main>
        </div>
    );
};

export default SeasonPlayerPage;
