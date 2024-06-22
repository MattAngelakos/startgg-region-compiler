import React, { useState } from 'react';

const sortLev = (inputs, search, field) => {
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
        let currentLev = calculateLevenshtein(current[field], searchLower, current[field].length, searchLower.length);
        let j = i - 1;

        while (j >= 0 && (
            calculateLevenshtein(inputs[j][field], searchLower, inputs[j][field].length, searchLower.length) > currentLev ||
            (calculateLevenshtein(inputs[j][field], searchLower, inputs[j][field].length, searchLower.length) === currentLev && inputs[j]._id > current._id)
        )) {
            inputs[j + 1] = inputs[j];
            j--;
        }
        inputs[j + 1] = current;
    }
    return inputs;
}

const SearchList = ({ list, ListComponent, searchField }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');
  
    const handleSearchChange = (event) => {
      setSearchQuery(event.target.value);
    };
  
    const handleSubmit = () => {
      setSubmittedQuery(searchQuery);
      const filteredList = sortLev(list.opponents, searchQuery, searchField)
      list.opponents = filteredList
    };
    return (
        <div>
          <input
            type="text"
            placeholder={`Search by ${searchField}`}
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button onClick={handleSubmit}>Search</button>
          <ListComponent {...list} />
        </div>
      );
};

export default SearchList;

