import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from './Header';
import Results from './Results';
import Pagination from './Pagination';
import TournamentItem from './TournamentItem';
import { sortLev2 } from '../helpers';

const TournamentSearchSeason = () => {
    const { regionId, seasonName } = useParams();
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
                let region;
                let brackets = [];
                try {
                    const response = await fetch(`/regions/${regionId}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch region data');
                    }
                    const data = await response.json();
                    region = data.region;
                } catch (error) {
                    console.error('Error fetching region data:', error);
                }
                const response = await fetch(`/regions/${regionId}/seasons/${seasonName}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch region data');
                }
                const data = await response.json();
                let season = data[regionId];
                season.gameId = region.gameId;
                try {
                    const response = await fetch(`/regions/${regionId}/seasons/${season.seasonName}/players`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch players for season ${season.seasonName}`);
                    }
                    let playersData = await response.json();
                    playersData.players = await Promise.all(
                        playersData.players.map(async (player) => {
                            try {
                                const response = await fetch(`/regions/${regionId}/seasons/${season.seasonName}/players/${player._id}`);
                                if (!response.ok) {
                                    throw new Error(`Failed to fetch ${player._id} for season ${season.seasonName}`);
                                }
                                let playerData = await response.json();
                                player = playerData.player;
                                for (const game of player.games) {
                                    if (game.gameId === region.gameId) {
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
                                                        event: eventData[tournamentData.tournament._id]
                                                    });
                                                } catch (error) {
                                                    console.error(`Error fetching ${tournament.eventId}:`, error);
                                                }
                                            } catch (error) {
                                                console.error(`Error fetching ${tournament.tournamentId}:`, error);
                                            }
                                        }
                                    }
                                }
                                return player;
                            } catch (error) {
                                console.error(`Error fetching ${player._id} for season ${season.seasonName}:`, error);
                                return player;
                            }
                        })
                    );
                    season.players = playersData.players;
                } catch (error) {
                    console.error(`Error fetching players for season ${season.seasonName}:`, error);
                }
                setTournaments(brackets);
            } catch (error) {
                console.error('Error fetching season data:', error);
            }
        };
        fetchRegionData();
    }, [seasonName, regionId]);

    const seasonTournamentMapper = (tournament) => ({
        _id: tournament.tournament._id,
        tournament: tournament.tournament,
        event: tournament.event,
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
                brackets = tournaments.sort((a, b) => b.event.startAt - a.event.startAt);
                break;
            case 'startAt':
                brackets = tournaments.sort((a, b) => a.event.startAt - b.event.startAt);
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

    if (!filteredTournaments) {
        return <div>Loading...</div>;
    }

    let filteredTournaments2 = filteredTournaments.filter(tournament =>
        tournament.tournament.tournamentName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    let currentTournaments = filteredTournaments.slice(startIndex, endIndex);

    return (
        <div className="app">
            <Header />
            <main>
                <h1>League Detail for {regionId}</h1>
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
            </main>
        </div>
    );
};

export default TournamentSearchSeason;
