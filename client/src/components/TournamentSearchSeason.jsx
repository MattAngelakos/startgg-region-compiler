import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from './Header';
import Results from './Results';
import Pagination from './Pagination';
import TournamentItem from './TournamentItem';
import { sortLev2 } from '../helpers';


const TournamentSearchSeason = () => {
    const { regionId, seasonName } = useParams()
    const [season, setSeason] = useState(null)
    const [tournaments, setTournaments] = useState([])
    const [tournamentsQuery] = useState('')
    const [filterTournamentsQuery, setFilterTournamentsQuery] = useState('')
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const navigate = useNavigate();
    const location = useLocation();

    const handleSubmit = (e) => {
        e.preventDefault();
        setFilterTournamentsQuery(tournamentsQuery);
        console.log('Search Tournaments:', tournamentsQuery);
    }
    const handleInputChange = (event) => {
        setSearchQuery(event.target.value);
        setDropdownVisible(true);
    };
    const handlePlayerClick = (eventId) => {
        setDropdownVisible(false);
        console.log(location.pathname)
        navigate(`${location.pathname}/${eventId}`);
    };
    useEffect(() => {
        const fetchRegionData = async () => {
            try {
                let region
                let brackets = []
                try {
                    const response = await fetch(`/regions/${regionId}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch region data');
                    }
                    const data = await response.json();
                    region = data.region
                } catch (error) {
                    console.error('Error fetching region data:', error);
                }
                const response = await fetch(`/regions/${regionId}/seasons/${seasonName}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch region data');
                }
                const data = await response.json();
                let season = data[regionId]
                season.gameId = region.gameId
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
                                player = playerData.player
                                for (const game of player.games) {
                                    if (game.gameId === region.gameId) {
                                        for (let tournament of game.tournaments) {
                                            try {
                                                const response = await fetch(`/tournaments/${tournament.tournamentId}`)
                                                if (!response.ok) {
                                                    throw new Error(`Failed to fetch tournament`);
                                                }
                                                const tournamentData = await response.json()
                                                try {
                                                    const response = await fetch(`/tournaments/${tournament.tournamentId}/events/${tournament.eventId}`)
                                                    if (!response.ok) {
                                                        throw new Error(`Failed to fetch event`);
                                                    }
                                                    const eventData = await response.json()
                                                    brackets.push({
                                                        tournament: tournamentData.tournament,
                                                        event: eventData[tournamentData.tournament._id]
                                                    })
                                                } catch (error) {
                                                    console.error(`Error fetching ${tournament.eventId}:`, error);
                                                }
                                            } catch (error) {
                                                console.error(`Error fetching ${tournament.tournamentId}:`, error);
                                            }
                                        }
                                    }
                                }
                                return player
                            } catch (error) {
                                console.error(`Error fetching ${player._id} for season ${season.seasonName}:`, error);
                                return player
                            }
                        })
                    )
                    season.players = playersData.players
                } catch (error) {
                    console.error(`Error fetching players for season ${season.seasonName}:`, error);
                }
                console.log(brackets)
                setTournaments(brackets)
                setSeason(season);
            } catch (error) {
                console.error('Error fetching season data:', error);
            }
        };
        fetchRegionData();
    }, [seasonName, regionId]);
    const seasonPropMapper =(
        (tournament) => ({
            tournament: tournament.tournament,
            event: tournament.event,
        })
    );

    const filteredTournaments = useMemo(() => {
        if (!tournaments) return [];
        return sortLev2(tournaments, filterTournamentsQuery, 'tournamentName');
    }, [tournaments, filterTournamentsQuery]);
    let filteredTournaments2 = filteredTournaments.filter(tournament =>
        tournament.tournament.tournamentName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const currentTournaments = filteredTournaments.slice(startIndex, endIndex);
    if (!season) {
        return <div>Loading...</div>;
    }
    return (
        <div className="app">
            <Header />
            <main>
                <h1>League Detail for {regionId}</h1>
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
                <Results items={currentTournaments} Component={TournamentItem} propMapper={seasonPropMapper} />
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
}

export default TournamentSearchSeason;

