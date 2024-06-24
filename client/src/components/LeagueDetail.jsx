import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import SearchBar from './SearchBar';
import DateRangePicker from './DateRangePicker';

const LeagueDetail = () => {
    const { regionId } = useParams();
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
            </main>
        </div>
    );
};

export default LeagueDetail;