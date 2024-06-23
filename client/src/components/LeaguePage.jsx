import React, { useState } from 'react';
import Header from './Header';
import SearchBar from './SearchBar';
import GameFilter from './GameFilter';
import Results from './Results.jsx';

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

const initialLeagues = [
  { name: 'NJ Ultimate', game: 'SSBU', events: 5, players: 827, image: '../assets/666f1ddf2c269822c2f0b19b.png' },
  { name: 'NJ Melee', game: 'SSBM', events: 3, players: 420, image: '../assets/666f1ddf2c269822c2f0b19a.png' },
];

const LeaguePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ SSBU: true, SSBM: true });
  const [leagues, setLeagues] = useState(initialLeagues);

  const filteredLeagues = sortLev(leagues, searchQuery, 'name')
  return (
    <div className="app">
      <Header />
      <main>
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <GameFilter filters={filters} setFilters={setFilters} />
        <Results leagues={filteredLeagues} />
      </main>
    </div>
  );
};

export default LeaguePage;