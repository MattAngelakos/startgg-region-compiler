import React from 'react';
import MatchInfo from './matchDetails.jsx';

const MatchList = ({ matches }) => {
  return (
    <div>
      {matches.map((match, index) => (
        <MatchInfo key={index} matchDetails={match} />
      ))}
    </div>
  );
};

export default MatchList;