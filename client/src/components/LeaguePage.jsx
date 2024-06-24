import React, { useState, useEffect } from 'react';
import Header from './Header';
import SearchBar from './SearchBar';
import GameFilter from './GameFilter';
import Results from './Results';
import Pagination from './Pagination';

const sortLev = (inputs, search, type) => {
    const searchLower = search.toLowerCase();
    function calculateLevenshtein(input, search, x, y) {
        input = input.toLowerCase();
        if (input.includes(search)) return 0;
        if (x === 0) return y;
        if (y === 0) return x;
        const dp = Array(x + 1).fill(null).map(() => Array(y + 1).fill(null));
        for (let i = 0; i <= x; i++) { dp[i][0] = i }
        for (let j = 0; j <= y; j++) { dp[0][j] = j; }
        for (let i = 1; i <= x; i++) {
            for (let j = 1; j <= y; j++) {
                const substitutionCost = input[i - 1] === search[j - 1] ? 0 : 1;
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],
                    dp[i][j - 1],
                    dp[i - 1][j - 1] + substitutionCost
                );
            }
        }
        return dp[x][y];
    }
    for (let i = 1; i < inputs.length; i++) {
        let current = inputs[i];
        let currentLev = calculateLevenshtein(current[type], searchLower, current[type].length, searchLower.length);
        let j = i - 1;

        while (j >= 0 && (
            calculateLevenshtein(inputs[j][type], searchLower, inputs[j][type].length, searchLower.length) > currentLev ||
            (calculateLevenshtein(inputs[j][type], searchLower, inputs[j][type].length, searchLower.length) === currentLev && inputs[j]._id > current._id)
        )) {
            inputs[j + 1] = inputs[j];
            j--;
        }
        inputs[j + 1] = current;
    }
    return inputs;
}

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
                <Results leagues={currentLeagues} />
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