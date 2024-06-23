import React from 'react';

const GameFilter = ({ filters, setFilters }) => {
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: checked,
    }));
  };

  return (
    <div className="game-filter">
      <label>Games</label>
      <label>
        <input
          type="checkbox"
          name="SSBU"
          checked={filters.SSBU}
          onChange={handleCheckboxChange}
        />
        SSBU
      </label>
      <label>
        <input
          type="checkbox"
          name="SSBM"
          checked={filters.SSBM}
          onChange={handleCheckboxChange}
        />
        SSBM
      </label>
    </div>
  );
};

export default GameFilter;
