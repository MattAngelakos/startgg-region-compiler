import React from 'react';

const SearchBar = ({ query, setQuery, searchWord }) => {
  return (
    <div className="search-bar">
      <label htmlFor={`search-${searchWord.toLowerCase()}`}>Search {searchWord}</label>
      <input
        type="text"
        id={`search-${searchWord.toLowerCase()}`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
