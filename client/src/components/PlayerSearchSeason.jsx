import React, { useState, useEffect, useCallback, useMemo } from 'react';
import LoadingScreen from './LoadingScreen';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from './Header';
import PlayerItem from './PlayerItem';
import Results from './Results';
import { sortLev } from '../helpers';
import Pagination from './Pagination';


const PlayerSearchSeason = () => {
    const { regionId, seasonName } = useParams()
    const [season, setSeason] = useState(null)
    const [regionName, setRegionName] = useState('')
    const [characterIcons, setCharacterIcons] = useState(null)
    const [gameId, setGameId] = useState(null)
    const [playersQuery] = useState('')
    const [filterPlayersQuery, setFilterPlayersQuery] = useState('')
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [sortKey, setSortKey] = useState('glicko');
    const navigate = useNavigate();
    const location = useLocation();

    const handleSubmit = (e) => {
        e.preventDefault();
        setFilterPlayersQuery(searchQuery);
        console.log('Search Players:', playersQuery);
    }
    const handleInputChange = (event) => {
        setSearchQuery(event.target.value);
        setDropdownVisible(true);
    };
    const handlePlayerClick = (playerId) => {
        setDropdownVisible(false);
        navigate(`${location.pathname}/${playerId}`);
    };
    useEffect(() => {
        // One request for the whole list. This used to fetch the region, the
        // season, the player list, each player individually, and the ratings
        // separately -- 24 requests that each re-ran the same season filtering.
        const loadSeason = async () => {
            try {
                const response = await fetch(`/regions/${regionId}/seasons/${seasonName}/players-summary`);
                if (!response.ok) {
                    throw new Error('Failed to fetch season players');
                }
                const data = await response.json();
                setGameId(data.region.gameId);
                setRegionName(data.region.regionName);
                setSeason({ seasonName: seasonName, gameId: data.region.gameId, players: data.players });
            } catch (error) {
                console.error('Error fetching season players:', error);
            }
        };
        loadSeason();
    }, [seasonName, regionId]);
    useEffect(() => {
        if (!gameId) return;
        const fetchCharacterIcons = async () => {
            try {
                const response = await fetch(`/games/${gameId}/characters`);
                if (!response.ok) {
                    throw new Error('Failed to fetch character icons');
                }
                const data = await response.json();
                setCharacterIcons(data.characters);
            } catch (error) {
                console.error('Error fetching character icons:', error);
            }
        };
        fetchCharacterIcons();
    }, [gameId]);

    const seasonPropMapper = useCallback(
        (player) => ({
            player: player,
            gameId: gameId,
            characterIcons: characterIcons,
            seasonPath: `/regions/${regionId}/seasons/${seasonName}/players`,
        }),
        [gameId, characterIcons, regionId, seasonName]
    );
    let filteredPlayers = useMemo(() => {
        if (!season) return [];
        let players
        const byNumber = (key) => (a, b) => {
            // Players with no rating sort last rather than to the top.
            const av = a[key] === undefined ? -Infinity : a[key];
            const bv = b[key] === undefined ? -Infinity : b[key];
            return bv - av;
        };
        switch (sortKey) {
            case 'glicko':
                players = (season.players).sort(byNumber('glicko'));
                break;
            case '-glicko':
                players = (season.players).sort((a, b) => byNumber('glicko')(b, a));
                break;
            case 'elo':
                players = (season.players).sort(byNumber('elo'));
                break;
            case '-elo':
                players = (season.players).sort((a, b) => byNumber('elo')(b, a));
                break;
            case '-tournamentName':
                players = (season.players).sort((a, b) => b.gamerTag.localeCompare(a.gamerTag));
                break;
            case 'tournamentName':
                players = (season.players).sort((a, b) => a.gamerTag.localeCompare(b.gamerTag));
                break;
            case 'entrants':
                players = (season.players).sort((a, b) => b.brackets - a.brackets);
                break;
            case '-entrants':
                players = (season.players).sort((a, b) => a.brackets - b.brackets);
                break;
            default:
                players = season.players
                break;
        }
        if (filterPlayersQuery !== '') {
            return sortLev(players, filterPlayersQuery, 'gamerTag');
        }
        else {
            console.log(players)
            return players
        }
    }, [season, filterPlayersQuery, sortKey]);
    if (!filteredPlayers) {
        return <LoadingScreen label={"Loading players…"} rows={6} />;
    }
    let filteredPlayers2 = filteredPlayers.filter(player =>
        player.gamerTag.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const currentPlayers = filteredPlayers.slice(startIndex, endIndex);
    if (!season) {
        return <LoadingScreen label={"Loading players…"} rows={6} />;
    }
    return (
        <div className="app">
            <Header link={`/regions/${regionId}/seasons/${seasonName}`} linkname={seasonName} />
            <main>
                <h1>{regionName ? `${regionName} - ${seasonName}` : seasonName} Players</h1>
                <div className="sort-options">
                    <label>Sort by: </label>
                    <select onChange={(e) => setSortKey(e.target.value)} value={sortKey}>
                        <option value="glicko">Glicko-2 (highest)</option>
                        <option value="-glicko">Glicko-2 (lowest)</option>
                        <option value="elo">Elo (highest)</option>
                        <option value="-elo">Elo (lowest)</option>
                        <option value="tournamentName">Alphanumerical</option>
                        <option value="-tournamentName">Reverse Alphanumerical</option>
                        <option value="entrants">Most Brackets</option>
                        <option value="-entrants">Lowest Brackets</option>
                    </select>
                </div>
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
                                <PlayerItem player={player} gameId={gameId} />
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

