import React, { useState, useEffect } from 'react';
import Header from './Header';
import SearchBar from './SearchBar';
import GameFilter from './GameFilter';
import Results from './Results';
import Pagination from './Pagination';
import LeagueItem from './LeagueItem';
import { sortLev } from '../helpers';

const LeaguePage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ SSBU: true, SSBM: true });
    const [leagues, setLeagues] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    useEffect(() => {
        const fetchRegionData = async () => {
            try {
                const response = await fetch(`/regions`);
                if (!response.ok) {
                    throw new Error('Failed to fetch region data');
                }
                const data = await response.json();
                setLeagues(data.regions);
            } catch (error) {
                console.error('Error fetching region data:', error);
            }
        };
        fetchRegionData();
    }, []);

    if (!leagues) {
        return <div>Loading...</div>;
    }

    const filteredLeagues = sortLev(leagues, searchQuery, 'regionName');
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const currentLeagues = filteredLeagues.slice(startIndex, endIndex);
    const leaguePropMapper = (league) => ({
        league
    });
    return (
        <div className="app">
            <Header />
            <main>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    setSearchQuery(searchQuery);
                }}>
                    <SearchBar query={searchQuery} setQuery={setSearchQuery} searchWord="Name" />
                    <GameFilter filters={filters} setFilters={setFilters} />
                    <button type="submit">Search</button>
                </form>
                <Results items={currentLeagues} Component={LeagueItem} propMapper={leaguePropMapper}/>
                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredLeagues.length}
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

export default LeaguePage;