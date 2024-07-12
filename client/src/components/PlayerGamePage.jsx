import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from './Header';
import Results from './Results';
import Pagination from './Pagination';
import TournamentItem from './TournamentItem';
import { compareWinrate, sortLev2 } from '../helpers';
import OpponentItem from './OpponentItem';
import TournamentFilter from './TournamentFilter';

const PlayerGamePage = () => {
    const { playerId, gameId } = useParams();
    const [player, setPlayer] = useState(null);
    const [game, setGame] = useState(null);
    const [characters, setCharacters] = useState(null)
    const [tournaments, setTournaments] = useState([]);
    const [filteredTournaments, setFilteredTournaments] = useState([]);
    const [filteredOpponents, setFilteredOpponents] = useState([]);
    const [filterTournamentsQuery, setFilterTournamentsQuery] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [currentPage2, setCurrentPage2] = useState(1);
    const [perPage2, setPerPage2] = useState(5);
    const navigate = useNavigate();
    const location = useLocation();
    const [sortKey, setSortKey] = useState('tournamentName');
    const [sortKey2, setSortKey2] = useState('tournamentName');

    const fetchRegionData = async () => {
        try {
            const response = await fetch(`/players/${playerId}`);
            if (!response.ok) throw new Error('Failed to fetch player data');
            const data = await response.json();
            const playerData = data.player;
            setPlayer(playerData);
            const gameData = playerData.games.find(g => g.gameId === parseInt(gameId));
            if (gameData) {
                await fetchTournamentData(gameData);
                setGame(gameData);
                setFilteredOpponents(gameData.opponents);
                setCharacters(aggregateCharacterData(gameData.opponents));
            }
        } catch (error) {
            console.error('Error fetching region data:', error);
        }
    };

    const fetchTournamentData = async (gameData) => {
        let brackets = [];
        for (const tournament of gameData.tournaments) {
            try {
                const tournamentData = await fetchData(`/tournaments/${tournament.tournamentId}`);
                const eventData = await fetchData(`/tournaments/${tournament.tournamentId}/events/${tournament.eventId}`);
                const nameOfBracket = `${tournamentData.tournament.tournamentName}: ${eventData[tournamentData.tournament._id].eventName}`;
                brackets.push({
                    _id: tournamentData.tournament._id,
                    tournament: tournamentData.tournament,
                    event: eventData[tournamentData.tournament._id],
                    placement: tournament.placement,
                    nameOfBracket
                });
            } catch (error) {
                console.error(`Error fetching tournament ${tournament.tournamentId}:`, error);
            }
        }
        gameData.opponents.forEach(opponent => {
            opponent._id = opponent.opponentId;
            opponent.tournaments = addTournamentNames(opponent.tournaments, brackets);
        });
        setTournaments(brackets);
    };

    const fetchData = async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch data from ${url}`);
        return response.json();
    };

    const addTournamentNames = (tournaments, brackets) => {
        return tournaments.map(tournament => {
            const bracket = brackets.find(bracket =>
                bracket.tournament._id === tournament.tournamentId &&
                bracket.event.eventId === tournament.eventId
            );
            return {
                ...tournament,
                tournamentName: bracket ? `${bracket.tournament.tournamentName}: ${bracket.event.eventName}` : 'Unknown Tournament',
                startAt: bracket ? bracket.event.startAt : -1
            };
        });
    };

    const aggregateCharacterData = (opponents) => {
        let playerCharacters = {};
        opponents.forEach(opponent => {
            opponent.tournaments.forEach(tournament => {
                tournament.matches.forEach(match => {
                    updateCharacterData(playerCharacters, match);
                });
            });
        });
        return playerCharacters;
    };

    const updateCharacterData = (playerCharacters, match) => {
        if (!playerCharacters.hasOwnProperty(match.playerChar)) {
            playerCharacters[match.playerChar] = { plays: 0, winrate: 0, stages: {} };
        }
        const playerChar = playerCharacters[match.playerChar];
        playerChar.plays += 1;
        updateMatchData(playerChar, match);
        if (match.stage !== "N/A") {
            if (!playerChar.stages.hasOwnProperty(match.stage)) {
                playerChar.stages[match.stage] = { plays: 0, winrate: 0 };
            }
            const stage = playerChar.stages[match.stage];
            stage.plays += 1;
            updateMatchData(stage, match);
        }
    };

    const updateMatchData = (charData, match) => {
        const opponentChar = charData[match.opponentChar] || { plays: 0, winrate: 0, stages: {} };
        opponentChar.plays += 1;
        charData[match.opponentChar] = opponentChar;

        if (match.type === 'win') {
            charData.winrate = ((charData.plays - 1) * charData.winrate + 1) / charData.plays;
            opponentChar.winrate = ((opponentChar.plays - 1) * opponentChar.winrate + 1) / opponentChar.plays;
        } else if (match.type === 'loss') {
            charData.winrate = ((charData.plays - 1) * charData.winrate) / charData.plays;
            opponentChar.winrate = ((opponentChar.plays - 1) * opponentChar.winrate) / opponentChar.plays;
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFilteredTournaments(tournaments.filter(tournament =>
            tournament.tournament.tournamentName.toLowerCase().includes(searchQuery.toLowerCase())
        ));
    };

    const handleInputChange = (event) => {
        setSearchQuery(event.target.value);
        setDropdownVisible(true);
    };

    const handlePlayerClick = (eventId) => {
        setDropdownVisible(false);
        navigate(`${location.pathname}/${eventId}`);
    };
    
    useEffect(() => {
        fetchRegionData();
    }, [playerId, gameId]);

    useEffect(() => {
        setFilteredTournaments(tournaments);
    }, [tournaments]);
    
    const seasonTournamentMapper = (tournament) => ({
        tournament: tournament.tournament,
        event: tournament.event,
        placement: tournament.placement
    });

    const opponentMapper = (opponent) => ({
        opponent: opponent
    });

    let sortedTournaments = useMemo(() => {
        if (!filteredTournaments) return [];
        let brackets;
        switch (sortKey) {
            case '-tournamentName':
                brackets = filteredTournaments.sort((a, b) => b.tournament.tournamentName.localeCompare(a.tournament.tournamentName));
                break;
            case 'tournamentName':
                brackets = filteredTournaments.sort((a, b) => a.tournament.tournamentName.localeCompare(b.tournament.tournamentName));
                break;
            case 'entrants':
                brackets = filteredTournaments.sort((a, b) => b.event.entrants - a.event.entrants);
                break;
            case '-entrants':
                brackets = filteredTournaments.sort((a, b) => a.event.entrants - b.event.entrants);
                break;
            case '-startAt':
                brackets = filteredTournaments.sort((a, b) => a.event.startAt - b.event.startAt);
                break;
            case 'startAt':
                brackets = filteredTournaments.sort((a, b) => b.event.startAt - a.event.startAt);
                break;
            default:
                break;
        }
        if (filterTournamentsQuery !== '') {
            return sortLev2(brackets, filterTournamentsQuery, 'tournamentName');
        } else {
            return brackets;
        }
    }, [filteredTournaments, filterTournamentsQuery, sortKey]);

    let sortedOpponents = useMemo(() => {
        if (!game) return [];
        if (!filteredOpponents) return [];
        if (sortKey2 === "recent" || sortKey2 === "-recent") {
            for (let opponent of filteredOpponents) {
                opponent['mostRecent'] = -1;
                for (const match of opponent.tournaments) {
                    if (opponent.mostRecent < match.startAt) {
                        opponent.mostRecent = match.startAt;
                    }
                }
            }
        }
        let opponents
        switch (sortKey2) {
            case '-tournamentName':
                opponents = filteredOpponents.sort((a, b) => b.opponentName.localeCompare(a.opponentName));
                break;
            case 'tournamentName':
                opponents = filteredOpponents.sort((a, b) => a.opponentName.localeCompare(b.opponentName));
                break;
            case 'entrants':
                opponents = filteredOpponents.sort((a, b) => b.tournaments.length - a.tournaments.length);
                break;
            case '-entrants':
                opponents = filteredOpponents.sort((a, b) => a.tournaments.length - b.tournaments.length);
                break;
            case '-startAt':
                opponents = filteredOpponents.sort((a, b) => compareWinrate(b, a));
                break;
            case 'startAt':
                opponents = filteredOpponents.sort((a, b) => compareWinrate(a, b));
                break;
            case 'recent':
                opponents = filteredOpponents.sort((a, b) => a.mostRecent - b.mostRecent);
                break;
            case '-recent':
                opponents = filteredOpponents.sort((a, b) => b.mostRecent - a.mostRecent);
                break;
            default:
                break;
        }
        return opponents;
    }, [game, sortKey2, filteredOpponents]);

    const handleFilter = (filteredBrackets) => {
        const checkIds = filteredBrackets.map(item => item.event.eventId);
        const filtered = tournaments.filter(item => !checkIds.includes(item.event.eventId))
        let opponents = filteredOpponents
        for (let i = opponents.length - 1; i >= 0; i--) {
            let opponent = opponents[i];
            opponent.tournaments = opponent.tournaments.filter(item => !checkIds.includes(item.eventId));
            if (opponent.tournaments.length === 0) {
                opponents.splice(i, 1);
            }
        }
        setFilteredTournaments(filtered);
        setFilteredOpponents(opponents)
    };

    let filteredTournaments2 = sortedTournaments.filter(tournament =>
        tournament.tournament.tournamentName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!player || !game || !sortedTournaments || !characters) {
        return <div>Loading...</div>;
    }

    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const startIndex2 = (currentPage2 - 1) * perPage2;
    const endIndex2 = startIndex2 + perPage2;
    let currentTournaments = sortedTournaments.slice(startIndex, endIndex);
    let currentOpponents = sortedOpponents.slice(startIndex2, endIndex2);

    return (
        <div className="app">
            <Header link={`/players/${playerId}`} linkname={'Players'} />
            <main>
                {player.gamerTag}
                <TournamentFilter
                    tournaments={tournaments}
                    filterh2h={handleFilter}
                />
                <div className="sort-options">
                    <label>Sort by: </label>
                    <select onChange={(e) => setSortKey(e.target.value)} value={sortKey}>
                        <option value="tournamentName">Alphanumerical</option>
                        <option value="-tournamentName">Reverse Alphanumerical</option>
                        <option value="entrants">Highest Entrants</option>
                        <option value="-entrants">Lowest Entrants</option>
                        <option value="-startAt">Earliest Date</option>
                        <option value="startAt">Latest Date</option>
                    </select>
                </div>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Search for a tournament"
                        value={searchQuery}
                        onChange={handleInputChange}
                        onBlur={() => setTimeout(() => setDropdownVisible(false), 200)}
                        onFocus={() => setDropdownVisible(true)}
                    />
                    <button type="submit">Search</button>
                </form>
                {dropdownVisible && filteredTournaments2.length > 0 && (
                    <ul style={{ border: '1px solid #ccc', marginTop: '0', position: 'absolute', zIndex: '1', backgroundColor: 'white', listStyleType: 'none', paddingLeft: '0', width: '200px' }}>
                        {filteredTournaments2.map(tournament => (
                            <li
                                key={tournament._id}
                                onMouseDown={() => handlePlayerClick(tournament._id)}
                                style={{ padding: '8px', cursor: 'pointer' }}
                            >
                                <TournamentItem tournament={tournament.tournament} event={tournament.event} />
                            </li>
                        ))}
                    </ul>
                )}
                <Results items={currentTournaments} Component={TournamentItem} propMapper={seasonTournamentMapper} />
                <Pagination
                    currentPage={currentPage}
                    totalItems={sortedTournaments.length}
                    perPage={perPage}
                    onChangePage={setCurrentPage}
                    onChangePerPage={(newPerPage) => {
                        setPerPage(newPerPage);
                        setCurrentPage(1);
                    }}
                />
                <div className="sort-options">
                    <label>Sort by: </label>
                    <select onChange={(e) => setSortKey2(e.target.value)} value={sortKey2}>
                        <option value="tournamentName">Alphanumerical</option>
                        <option value="-tournamentName">Reverse Alphanumerical</option>
                        <option value="entrants">Most Played</option>
                        <option value="-entrants">Least Played</option>
                        <option value="-startAt">Highest Winrate</option>
                        <option value="startAt">Lowest Winrate</option>
                        <option value="-recent">Most Recent</option>
                        <option value="recent">Least Recent</option>
                    </select>
                </div>
                <Results items={currentOpponents} Component={OpponentItem} propMapper={opponentMapper} />
                <Pagination
                    currentPage={currentPage2}
                    totalItems={sortedOpponents.length}
                    perPage={perPage2}
                    onChangePage={setCurrentPage2}
                    onChangePerPage={(newPerPage) => {
                        setPerPage2(newPerPage);
                        setCurrentPage2(1);
                    }}
                />
            </main>
        </div>
    );
};

export default PlayerGamePage;
