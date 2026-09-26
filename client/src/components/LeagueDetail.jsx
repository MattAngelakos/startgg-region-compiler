import React, { useState, useEffect, useCallback, useMemo } from 'react';
import LoadingScreen from './LoadingScreen';
import { useParams } from 'react-router-dom';
import Header from './Header';
import SearchBar from './SearchBar';
import DateRangePicker from './DateRangePicker';
import Results from './Results';
import SeasonItem from './SeasonItem';

const LeagueDetail = () => {
    const { regionId } = useParams();
    const [region, setRegion] = useState(null);
    const [seasons, setSeasons] = useState([]);
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
    };

    useEffect(() => {
        // One request for the whole page. This used to walk every season, then
        // every player in it, then every tournament of every player, which ran
        // into the thousands of round trips and stalled before rendering.
        const fetchSummary = async () => {
            try {
                const response = await fetch(`/regions/${regionId}/seasons-summary`);
                if (!response.ok) {
                    throw new Error('Failed to fetch season summaries');
                }
                const data = await response.json();
                setRegion(data.region);
                setSeasons(data.seasons);
            } catch (error) {
                console.error('Error fetching season summaries:', error);
            }
        };
        fetchSummary();
    }, [regionId]);

    const filteredSeasons = useMemo(() => {
        const contains = (values, query) =>
            values.some((value) => value.toLowerCase().includes(query.toLowerCase()));

        return seasons.filter((season) => {
            const matchesPlayers = filterPlayersQuery
                ? contains(season.playerTags, filterPlayersQuery)
                : true;
            const matchesTournaments = filterTournamentsQuery
                ? contains(season.tournamentNames, filterTournamentsQuery)
                : true;
            const matchesStart = sendStartDate
                ? Math.floor(sendStartDate / 1000) <= season.startDate
                : true;
            const matchesEnd = sendEndDate
                ? Math.floor(sendEndDate / 1000) >= season.endDate
                : true;
            return matchesPlayers && matchesTournaments && matchesStart && matchesEnd;
        }).map((season) => ({ ...season, _id: season.seasonName }));
    }, [seasons, filterPlayersQuery, filterTournamentsQuery, sendStartDate, sendEndDate]);

    const seasonPropMapper = useCallback(
        (season) => ({
            regionId: regionId,
            season: season
        }),
        [regionId]
    );

    if (!region) {
        return <LoadingScreen label={"Loading seasons…"} rows={5} link={`/regions`} linkname={'Region'} />;
    }

    return (
        <div className="app">
            <Header link={`/regions`} linkname={'Region'} />
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
                <h1>{region.regionName} Seasons</h1>
                <Results items={filteredSeasons} Component={SeasonItem} propMapper={seasonPropMapper} />
            </main>
        </div>
    );
};

export default LeagueDetail;
