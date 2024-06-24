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

    const handleSubmit = (e) => {
        e.preventDefault();
        setFilterPlayersQuery(playersQuery);
        setFilterTournamentsQuery(tournamentsQuery);
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
                            const response = await fetch(`/regions/${regionId}/seasons/${season.seasonName}/players`);
                            if (!response.ok) {
                                throw new Error(`Failed to fetch players for season ${season.seasonName}`);
                            }
                            const playersData = await response.json();
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
            const matchesStartQuery = startDate ? ((Math.floor(startDate / 1000)) <= season.startDate) : true
            const matchesEndQuery = endDate ? ((Math.floor(endDate / 1000)) >= season.endDate) : true
            return matchesPlayersQuery && matchesStartQuery && matchesEndQuery;
        }).map((season) => ({
            ...season,
            _id: season.seasonName,
        }));
    }, [region, filterPlayersQuery, filterTournamentsQuery, startDate, endDate]);

    const seasonPropMapper = useCallback(
        (season) => ({
            regionId: regionId,
            season: season,
        }),
        [regionId]
    );

    if (!region) {
        return <div>Loading...</div>;
    }

    return (
        <div className="app">
            <Header />
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