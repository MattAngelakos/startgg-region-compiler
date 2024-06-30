import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import SearchBar from './SearchBar';
import DateRangePicker from './DateRangePicker';
import Results from './Results';
import SeasonItem from './SeasonItem';

const LeagueDetail = () => {
    const { regionId } = useParams();
    const [region, setRegion] = useState(null);
    const [playersQuery, setPlayersQuery] = useState('');
    const [tournamentsQuery, setTournamentsQuery] = useState('');
    const [filterPlayersQuery, setFilterPlayersQuery] = useState('');
    const [filterTournamentsQuery, setFilterTournamentsQuery] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [sendStartDate, sendSetStartDate] = useState(null);
    const [sendEndDate, sendSetEndDate] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setFilterPlayersQuery(playersQuery);
        setFilterTournamentsQuery(tournamentsQuery);
        sendSetStartDate(startDate);
        sendSetEndDate(endDate);
        console.log('Search Players:', playersQuery);
        console.log('Search Tournaments:', tournamentsQuery);
        console.log('Selected Date Range:', { startDate, endDate });
    };

    useEffect(() => {
        const fetchRegionData = async () => {
            try {
                const response = await fetch(`/regions/${regionId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch region data');
                }
                const data = await response.json();
                const updatedSeasons = await Promise.all(
                    data.region.seasons.map(async (season) => {
                        try {
                            season.gameId = data.region.gameId
                            const response = await fetch(`/regions/${regionId}/seasons/${season.seasonName}/players`);
                            if (!response.ok) {
                                throw new Error(`Failed to fetch players for season ${season.seasonName}`);
                            }
                            let playersData = await response.json();
                            playersData.players = await Promise.all(
                                playersData.players.map(async (player) => {
                                    try{
                                        const response = await fetch(`/regions/${regionId}/seasons/${season.seasonName}/players/${player._id}`);
                                        if (!response.ok) {
                                            throw new Error(`Failed to fetch ${player._id} for season ${season.seasonName}`);
                                        }
                                        let playerData = await response.json();
                                        player = playerData.player
                                        for(const game of player.games){
                                            if(game.gameId === data.region.gameId){
                                                for(const tournament of game.tournaments){
                                                    try{
                                                        const response = await fetch(`/tournaments/${tournament.tournamentId}`)
                                                        if (!response.ok) {
                                                            throw new Error(`Failed to fetch tournament`);
                                                        }
                                                        const tournamentData = await response.json()
                                                        tournament.name = tournamentData.tournament.tournamentName
                                                    }catch(error){
                                                        console.error(`Error fetching ${tournament.tournamentId}:`, error);   
                                                    }
                                                }
                                            }
                                        }
                                        return player
                                    }catch (error) {
                                        console.error(`Error fetching ${player._id} for season ${season.seasonName}:`, error);
                                        return player
                                    }
                                })
                            )
                            return { ...season, players: playersData.players };
                        } catch (error) {
                            console.error(`Error fetching players for season ${season.seasonName}:`, error);
                            return { ...season, players: [] };
                        }
                    })
                );
                setRegion({ ...data.region, seasons: updatedSeasons });
            } catch (error) {
                console.error('Error fetching region data:', error);
            }
        };
        fetchRegionData();
    }, [regionId]);
    const filteredSeasons = useMemo(() => {
        if (!region) return [];
        return region.seasons.filter((season) => {
            const matchesPlayersQuery = filterPlayersQuery
                ? season.players.some(player => player.gamerTag.toLowerCase().includes(filterPlayersQuery.toLowerCase()))
                : true;
            let matchesTournamentQuery = filterTournamentsQuery ? false : true
            if(!matchesTournamentQuery){
                for(const player of season.players){
                    for(const game of player.games){
                        if(game.gameId === season.gameId){
                            matchesTournamentQuery = game.tournaments.some(tournament => tournament.name.toLowerCase().includes(filterTournamentsQuery.toLowerCase()))
                            break
                        }
                    }
                    if(matchesTournamentQuery){
                        break
                    }
                }
            }
            const matchesStartQuery = sendStartDate ? ((Math.floor(sendStartDate / 1000)) <= season.startDate) : true
            const matchesEndQuery = sendEndDate ? ((Math.floor(sendEndDate / 1000)) >= season.endDate) : true
            return matchesPlayersQuery && matchesStartQuery && matchesEndQuery && matchesTournamentQuery;
        }).map((season) => ({
            ...season,
            _id: season.seasonName,
        }));
    }, [region, filterPlayersQuery, filterTournamentsQuery, sendStartDate, sendEndDate]);
    const seasonPropMapper = useCallback(
        (season) => ({
            regionId: regionId,
            season: season
        }),
        [regionId]
    );
    if (!region) {
        return <div>Loading...</div>;
    }
    return (
        <div className="app">
            <Header link={`/regions`}linkname={'Region'}/>
            <main>
                <form onSubmit={handleSubmit}>
                    <SearchBar query={playersQuery} setQuery={setPlayersQuery} searchWord="Players" />
                    <SearchBar query={tournamentsQuery} setQuery={setTournamentsQuery} searchWord="Tournaments" />
                    <DateRangePicker
                        startDate={startDate}
                        setStartDate={setStartDate}
                        endDate={endDate}
                        setEndDate={setEndDate}
                    />
                    <button type="submit">Search</button>
                </form>
                <h1>League Detail for {regionId}</h1>
                <Results items={filteredSeasons} Component={SeasonItem} propMapper={seasonPropMapper} />
            </main>
        </div>
    );
};

export default LeagueDetail;