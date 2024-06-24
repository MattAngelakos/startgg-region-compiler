import React from 'react';
import LeagueItem from './LeagueItem';

const Results = ({ leagues }) => {

  return (
    <div className="results">
      {leagues.map((league) => (
        <LeagueItem key={league.regionName} league={league} />
      ))}
    </div>
  );
};

export default Results;
