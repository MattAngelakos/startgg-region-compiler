import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from './Header';
import Results from './Results';
import Pagination from './Pagination';
import TournamentItem from './TournamentItem';
import { sortLev2 } from '../helpers';
import LinkButton from './LinkButton';
import SeasonInfo from './SeasonInfo';
import Background from './Background';

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
            <Background/>
            <Header/>
            <main>
            <div className="Buttons w-96 h-28 left-[247px] top-[725px] absolute">
                    {/* Need to redirect to /players instead of /tournaments */}
                    <LinkButton to=""> 
                    <div className="SearchPlayers w-96 h-24 px-14 py-9 left-[562px] top-0 absolute bg-zinc-300 rounded-full shadow justify-center items-center gap-2.5 inline-flex">
                        <div className="SearchPlayers text-center text-black text-3xl font-medium font-['Inter'] leading-10">Search Players</div>
                    </div>
                    </LinkButton>
                    {/* Need to redirect back */}
                    <LinkButton to="">
                    <div className="LeagueHomePage w-96 h-24 px-14 py-9 left-0 top-0 absolute bg-zinc-300 rounded-full shadow justify-center items-center gap-2.5 inline-flex">
                        <div className="LeagueHomePage text-center text-black text-3xl font-medium font-['Inter'] leading-10">League Home Page</div>
                    </div>
                    </LinkButton>
                </div>
                <div className="Rectangle2 w-3/4 h-64 left-[150px] top-[450px] absolute bg-zinc-300 shadow border-4 border-black" />
                <div className="SearchResults w-96 h-96 left-[137px] top-[400px] absolute">
                    
                    <div className="Tournament3 w-96 h-14 left-[25px] top-[211px] absolute">
                    <div className="PlayerCount h-10 left-[931px] top-[10px] absolute justify-start items-center gap-0.5 inline-flex">
                        <img className="Tournament3PlayerImage w-10 h-10" src="https://via.placeholder.com/40x40" />
                        <div className="Tournament3Numentrants text-black text-2xl font-medium font-['Inter'] leading-9">34</div>
                    </div>
                    <div className="Tournament3Date h-9 left-[763px] top-[12px] absolute justify-start items-start gap-3 inline-flex">
                        <img className="Tournament3DateImage w-7 h-8" src="https://via.placeholder.com/30x33" />
                        <div className="Tournament3Date text-black text-2xl font-medium font-['Inter'] leading-9">05/03/24</div>
                    </div>
                    <div className="IconAndName h-14 left-0 top-0 absolute justify-start items-center gap-6 inline-flex">
                        <img className="Tournament3Icon w-14 h-14 rounded-3xl" src="https://via.placeholder.com/60x60" />
                        <div className="Tournament3Name text-center text-black text-3xl font-medium font-['Inter'] leading-10">Encore Smash #246</div>
                    </div>
                    </div>
                    <div className="Tournament2 w-96 h-14 left-[25px] top-[137px] absolute">
                    <div className="PlayerCount h-10 left-[929px] top-[10px] absolute justify-start items-center gap-0.5 inline-flex">
                        <img className="Tournament2PlayerImage w-10 h-10" src="https://via.placeholder.com/40x40" />
                        <div className="Tournament2Numentrants text-black text-2xl font-medium font-['Inter'] leading-9">688</div>
                    </div>
                    <div className="Tournament2Date h-9 left-[763px] top-[10px] absolute justify-start items-start gap-3 inline-flex">
                        <img className="Tournament2DateImage w-7 h-8" src="https://via.placeholder.com/30x33" />
                        <div className="Tournament2Date text-black text-2xl font-medium font-['Inter'] leading-9">05/18/24</div>
                    </div>
                    <div className="IconAndName h-14 left-0 top-0 absolute justify-start items-center gap-6 inline-flex">
                        <img className="Tournament2Icon w-14 h-14 rounded-3xl" src="https://via.placeholder.com/60x60" />
                        <div className="Tournament2Name text-center text-black text-3xl font-medium font-['Inter'] leading-10">Get On My Level X</div>
                    </div>
                    </div>
                    <div className="Tournament1 w-96 h-14 left-[25px] top-[68px] absolute">
                    <div className="PlayerCount h-10 left-[929px] top-[13px] absolute justify-start items-center gap-0.5 inline-flex">
                        <img className="Tournament1PlayerImage w-10 h-10" src="https://via.placeholder.com/40x40" />
                        <div className="Tournament1Numentrants text-black text-2xl font-medium font-['Inter'] leading-9">45</div>
                    </div>
                    <div className="Tournament1Date h-9 left-[763px] top-[13px] absolute justify-start items-start gap-3 inline-flex">
                        <img className="Tournament1DateImage w-7 h-8" src="https://via.placeholder.com/30x33" />
                        <div className="Tournament1Date text-black text-2xl font-medium font-['Inter'] leading-9">05/20/24</div>
                    </div>
                    <div className="IconAndName h-14 left-0 top-0 absolute justify-start items-center gap-6 inline-flex">
                        <img className="Tournament1Icon w-14 h-14 rounded-3xl" src="https://via.placeholder.com/60x60" />
                        <div className="Tournament1Name text-center text-black text-3xl font-medium font-['Inter'] leading-10">Fusion #205</div>
                    </div>
                </div>
                </div>
                <div className="Results w-52 left-[620px] top-[400px] absolute text-center text-black text-4xl font-medium font-['Inter'] leading-10">Results</div>
                <div className="Rectangle3 w-96 h-14 left-[157px] top-[330px] absolute bg-zinc-300/60 shadow border-4 border-black" />
                <SeasonInfo/>
                <div className="LeagueName left-[580px] top-[150px] absolute text-center text-black text-6xl font-medium font-['Inter'] leading-10">NJ Ultimate</div>
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
                {/* <form onSubmit={handleSubmit}>
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
                /> */}
            </main>
        </div>
    );
};

export default TournamentSearchSeason;
