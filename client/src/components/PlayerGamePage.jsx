import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from './Header';
import Results from './Results';
import Pagination from './Pagination';
import TournamentItem from './TournamentItem';
import { sortLev2 } from '../helpers';
import OpponentItem from './OpponentItem';

const PlayerGamePage = () => {
    const { playerId, gameId } = useParams()
    const [player, setPlayer] = useState(null)
    const [game, setGame] = useState(null)
    const [tournaments, setTournaments] = useState([]);
    const [tournamentsQuery] = useState('');
    const [filterTournamentsQuery, setFilterTournamentsQuery] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const navigate = useNavigate();
    const location = useLocation();
    const [sortKey, setSortKey] = useState('tournamentName');
    const handleSubmit = (e) => {
        e.preventDefault();
        setFilterTournamentsQuery(searchQuery);
        console.log('Search Tournaments:', tournamentsQuery);
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
        const fetchRegionData = async () => {
            try {
                let brackets = []
                const response = await fetch(`/players/${playerId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch region data');
                }
                const data = await response.json();
                setPlayer(data.player);
                for(const game of data.player.games){
                    if(game.gameId === parseInt(gameId)){
                        setGame(game)
                        for (let tournament of game.tournaments) {
                            try {
                                const response = await fetch(`/tournaments/${tournament.tournamentId}`);
                                if (!response.ok) {
                                    throw new Error(`Failed to fetch tournament`);
                                }
                                const tournamentData = await response.json();
                                try {
                                    const response = await fetch(`/tournaments/${tournament.tournamentId}/events/${tournament.eventId}`);
                                    if (!response.ok) {
                                        throw new Error(`Failed to fetch event`);
                                    }
                                    const eventData = await response.json();
                                    brackets.push({
                                        _id: tournamentData.tournament._id,
                                        tournament: tournamentData.tournament,
                                        event: eventData[tournamentData.tournament._id],
                                        placement: tournament.placement
                                    });
                                } catch (error) {
                                    console.error(`Error fetching ${tournament.eventId}:`, error);
                                }
                            } catch (error) {
                                console.error(`Error fetching ${tournament.tournamentId}:`, error);
                            }
                        }
                        break
                    }
                }
                setTournaments(brackets);
            } catch (error) {
                console.error('Error fetching region data:', error);
            }
        };
        fetchRegionData();
    }, [playerId, gameId]);
    const seasonTournamentMapper = (tournament) => ({
        tournament: tournament.tournament,
        event: tournament.event,
        placement: tournament.placement
    });
    const opponentMapper = (opponent) => ({
        opponent: opponent,
        tournaments: tournaments
    });
    let filteredTournaments = useMemo(() => {
        if (!tournaments) return [];
        let brackets
        switch (sortKey) {
            case '-tournamentName':
                brackets = tournaments.sort((a, b) => b.tournament.tournamentName.localeCompare(a.tournament.tournamentName));
                break;
            case 'tournamentName':
                brackets = tournaments.sort((a, b) => a.tournament.tournamentName.localeCompare(b.tournament.tournamentName));
                break;
            case 'entrants':
                brackets = tournaments.sort((a, b) => b.event.entrants - a.event.entrants);
                break;
            case '-entrants':
                brackets = tournaments.sort((a, b) => a.event.entrants - b.event.entrants);
                break;
            case '-startAt':
                brackets = tournaments.sort((a, b) => a.event.startAt - b.event.startAt);
                break;
            case 'startAt':
                brackets = tournaments.sort((a, b) => b.event.startAt - a.event.startAt);
                break;
            default:
                break;
        }
        if(filterTournamentsQuery !== ''){
            return sortLev2(brackets, filterTournamentsQuery, 'tournamentName');
        }
        else{
            return brackets
        }
    }, [tournaments, filterTournamentsQuery, sortKey]);
    let filteredTournaments2 = filteredTournaments.filter(tournament =>
        tournament.tournament.tournamentName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (!player || !game || !filteredTournaments) {
        return <div>Loading...</div>;
    }
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    let currentTournaments = filteredTournaments.slice(startIndex, endIndex);
    return (
        <div className="app">
            <Header link={`/players/${playerId}`}linkname={'Players'}/>
            <main>
                {player.gamerTag}
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
                    totalItems={filteredTournaments.length}
                    perPage={perPage}
                    onChangePage={setCurrentPage}
                    onChangePerPage={(newPerPage) => {
                        setPerPage(newPerPage);
                        setCurrentPage(1);
                    }}
                />
                <Results items={game.opponents} Component={OpponentItem} propMapper={opponentMapper} />
            </main>
        </div>
    );
}

export default PlayerGamePage;