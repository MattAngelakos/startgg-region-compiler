import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from './Header';
import LoadingScreen from './LoadingScreen';
import { formatDate } from '../helpers';

// Every set played in one bracket by players on this season's roster, with the
// per-game characters and stages where they were recorded.
const BracketPage = () => {
    const { regionId, seasonName, tournamentId, eventId } = useParams();
    const [tournament, setTournament] = useState(null);
    const [results, setResults] = useState(null);
    const [characterIcons, setCharacterIcons] = useState(null);
    const [expanded, setExpanded] = useState({});

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const [tournamentResponse, resultsResponse, regionResponse] = await Promise.all([
                    fetch(`/tournaments/${tournamentId}`),
                    fetch(`/regions/${regionId}/seasons/${seasonName}/tournaments/${tournamentId}/events/${eventId}`),
                    fetch(`/regions/${regionId}`)
                ]);
                if (!tournamentResponse.ok || !resultsResponse.ok) {
                    throw new Error('Failed to load bracket');
                }
                if (cancelled) return;
                setTournament((await tournamentResponse.json()).tournament);
                const body = await resultsResponse.json();
                setResults(body.results || body);

                if (regionResponse.ok) {
                    const region = (await regionResponse.json()).region;
                    const iconResponse = await fetch(`/games/${region.gameId}/characters`);
                    if (iconResponse.ok && !cancelled) {
                        setCharacterIcons((await iconResponse.json()).characters);
                    }
                }
            } catch (error) {
                console.error('Error loading bracket:', error);
                if (!cancelled) setResults([]);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [regionId, seasonName, tournamentId, eventId]);

    const event = useMemo(() => {
        if (!tournament) return null;
        return (tournament.events || []).find((e) => e.eventId === parseInt(eventId)) || null;
    }, [tournament, eventId]);

    const placements = useMemo(() => {
        if (!results) return [];
        return [...results].sort((a, b) => a.placement - b.placement);
    }, [results]);

    // Each set is stored on both players, so collapse to one row per setId and
    // record it from the winner's side.
    const sets = useMemo(() => {
        if (!results) return [];
        const byId = new Map();
        for (const entry of results) {
            for (const record of entry.matches || []) {
                for (const set of record.tournaments || []) {
                    if (byId.has(set.setId)) continue;
                    const playerWon = set.type === 'win';
                    byId.set(set.setId, {
                        setId: set.setId,
                        winner: playerWon ? entry.gamerTag : record.opponentName,
                        loser: playerWon ? record.opponentName : entry.gamerTag,
                        winnerId: playerWon ? entry.id : record.opponentId,
                        loserId: playerWon ? record.opponentId : entry.id,
                        // games are recorded from `entry`'s perspective
                        games: (set.matches || []).map((g) => ({
                            number: g.matchNum,
                            stage: g.stage,
                            winnerChar: playerWon ? g.playerChar : g.opponentChar,
                            loserChar: playerWon ? g.opponentChar : g.playerChar,
                            winnerTookGame: playerWon ? g.type === 'win' : g.type === 'loss'
                        })).sort((a, b) => a.number - b.number)
                    });
                }
            }
        }
        const rows = [...byId.values()];
        for (const row of rows) {
            row.score = `${row.games.filter((g) => g.winnerTookGame).length}-${row.games.filter((g) => !g.winnerTookGame).length}`;
        }
        return rows;
    }, [results]);

    const iconFor = (name) =>
        characterIcons && characterIcons[name] ? characterIcons[name].stockIcon : null;

    if (!tournament || !results) {
        return <LoadingScreen label="Loading bracket…" rows={4} link={`/regions/${regionId}/seasons/${seasonName}/tournaments`} linkname={seasonName} />;
    }

    return (
        <div className="app">
            <Header link={`/regions/${regionId}/seasons/${seasonName}/tournaments`} linkname={seasonName} />
            <main>
                <div className="player-header">
                    {tournament.pfp && tournament.pfp !== 'N/A' && (
                        <img src={tournament.pfp} alt={tournament.tournamentName} className="player-header-pfp" />
                    )}
                    <div>
                        <h1>{tournament.tournamentName}</h1>
                        <div className="player-header-meta">
                            {event ? `${event.eventName} · ` : ''}
                            {event && event.startAt ? `${formatDate(new Date(event.startAt * 1000))} · ` : ''}
                            {tournament.city ? `${tournament.city} · ` : ''}
                            {event && event.entrants ? `${event.entrants} entrants` : ''}
                        </div>
                    </div>
                </div>

                <div className="stat-row">
                    <div className="stat">
                        <span className="stat-label">Roster players</span>
                        <span className="stat-value">{placements.length}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">Sets recorded</span>
                        <span className="stat-value">{sets.length}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">Entrants</span>
                        <span className="stat-value">{event && event.entrants ? event.entrants : '—'}</span>
                    </div>
                </div>

                <section className="player-section">
                    <h2>Placements</h2>
                    <table className="season-table">
                        <thead><tr><th>Place</th><th>Player</th></tr></thead>
                        <tbody>
                            {placements.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.placement}</td>
                                    <td className="cell-name">
                                        <Link to={`/regions/${regionId}/seasons/${seasonName}/players/${p.id}`}>{p.gamerTag}</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="section-note">Only players on this season's roster are listed.</p>
                </section>

                <section className="player-section">
                    <h2>Sets ({sets.length})</h2>
                    {sets.length === 0 && <p className="section-note">No sets recorded for roster players in this bracket.</p>}
                    <div className="set-list">
                        {sets.map((s) => (
                            <div className="set-row" key={s.setId}>
                                <button
                                    className="set-head"
                                    onClick={() => setExpanded((e) => ({ ...e, [s.setId]: !e[s.setId] }))}
                                    aria-expanded={!!expanded[s.setId]}
                                >
                                    <span className="set-winner">{s.winner}</span>
                                    <span className="set-score">{s.score}</span>
                                    <span className="set-loser">{s.loser}</span>
                                    {s.games.length > 0 && (
                                        <span className="set-toggle">{expanded[s.setId] ? 'hide games' : `${s.games.length} games`}</span>
                                    )}
                                </button>
                                {expanded[s.setId] && s.games.length > 0 && (
                                    <table className="season-table set-games">
                                        <thead><tr><th>Game</th><th>{s.winner}</th><th>{s.loser}</th><th>Stage</th><th>Winner</th></tr></thead>
                                        <tbody>
                                            {s.games.map((g) => (
                                                <tr key={g.number}>
                                                    <td>{g.number}</td>
                                                    <td className="cell-char">
                                                        {iconFor(g.winnerChar) && <img src={iconFor(g.winnerChar)} alt={g.winnerChar} className="character-icon" />}
                                                        {g.winnerChar}
                                                    </td>
                                                    <td className="cell-char">
                                                        {iconFor(g.loserChar) && <img src={iconFor(g.loserChar)} alt={g.loserChar} className="character-icon" />}
                                                        {g.loserChar}
                                                    </td>
                                                    <td>{g.stage}</td>
                                                    <td className={g.winnerTookGame ? 'cell-win' : 'cell-loss'}>
                                                        {g.winnerTookGame ? s.winner : s.loser}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default BracketPage;
