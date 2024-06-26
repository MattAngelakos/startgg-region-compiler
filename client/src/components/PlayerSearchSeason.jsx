import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from './Header';
import PlayerItem from './PlayerItem';
import Results from './Results';
import { sortLev } from '../helpers';
import Pagination from './Pagination';


const PlayerSearchSeason = () => {
    const { regionId, seasonName } = useParams()
    const [season, setSeason] = useState(null)
    const [gameId, setGameId] = useState(null)
    const [playersQuery] = useState('')
    const [filterPlayersQuery, setFilterPlayersQuery] = useState('')
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const navigate = useNavigate();
    const location = useLocation();

    const handleSubmit = (e) => {
        e.preventDefault();
        setFilterPlayersQuery(playersQuery);
        console.log('Search Players:', playersQuery);
    }
    const handleInputChange = (event) => {
        setSearchQuery(event.target.value);
        setDropdownVisible(true);
    };
    const handlePlayerClick = (playerId) => {
        setDropdownVisible(false);
        console.log(location.pathname)
        navigate(`${location.pathname}/${playerId}`);
    };
    useEffect(() => {
        const fetchRegionData = async () => {
            try {
                let region
                try {
                    const response = await fetch(`/regions/${regionId}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch region data');
                    }
                    const data = await response.json();
                    region = data.region
                    setGameId(region.gameId)
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
                                                tournament.name = tournamentData.tournament.tournamentName
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
                setSeason(season);
            } catch (error) {
                console.error('Error fetching season data:', error);
            }
        };
        fetchRegionData();
    }, [seasonName, regionId]);
    const seasonPropMapper = useCallback(
        (player) => ({
            player: player,
            gameId: gameId,
        }),
        [gameId]
    );
    let filteredPlayers = useMemo(() => {
        if (!season) return [];
        return sortLev(season.players, filterPlayersQuery, 'gamerTag')
    }, [season, filterPlayersQuery]);
    let filteredPlayers2 = filteredPlayers.filter(player =>
        player.gamerTag.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const currentPlayers = filteredPlayers.slice(startIndex, endIndex);
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
                        placeholder="Search for a player"
                        value={searchQuery}
                        onChange={handleInputChange}
                        onBlur={() => setTimeout(() => setDropdownVisible(false), 200)} // Close dropdown on blur with a slight delay
                        onFocus={() => setDropdownVisible(true)} // Open dropdown on focus
                    />
                    <button type="submit">Search</button>
                </form>
                {dropdownVisible && filteredPlayers2.length > 0 && (
                    <ul style={{ border: '1px solid #ccc', marginTop: '0', position: 'absolute', zIndex: '1', backgroundColor: 'white', listStyleType: 'none', paddingLeft: '0', width: '200px' }}>
                        {filteredPlayers2.map(player => (
                            <li
                                key={player._id}
                                onMouseDown={() => handlePlayerClick(player._id)}
                                style={{ padding: '8px', cursor: 'pointer' }}
                            >
                                <PlayerItem player={player} gameId={gameId}/>
                            </li>
                        ))}
                    </ul>
                )}
                <Results items={currentPlayers} Component={PlayerItem} propMapper={seasonPropMapper} />
                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredPlayers.length}
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

export default PlayerSearchSeason;

