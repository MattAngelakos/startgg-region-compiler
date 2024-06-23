import React, { useState } from 'react';

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  const [query, setQuery] = useState(searchQuery);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(query);
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <label htmlFor="search-leagues">Search Leagues</label>
      <input
        type="text"
        id="search-leagues"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  );
};

export default SearchBar;
