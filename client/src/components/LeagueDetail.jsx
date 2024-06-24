import React, { useState, useEffect } from 'react';
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
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const handleSubmit = (e) => {
        e.preventDefault();
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
                setRegion(data.region);
            } catch (error) {
                console.error('Error fetching region data:', error);
            }
        };
        fetchRegionData();
    }, [regionId]);
    if (!region) {
        return <div>Loading...</div>;
    }
    console.log(region)
    const seasonPropMapper = (season) => ({
        regionId: regionId,
        season: season,
        key: season.seasonName
    });
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
                <Results items={region.seasons} Component={SeasonItem} propMapper={seasonPropMapper}/>
            </main>
        </div>
    );
};

export default LeagueDetail;