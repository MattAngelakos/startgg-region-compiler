import React from 'react';
import OpponentList from './opponentList';

const TournamentResult = ({ list, tournament, event, entrantCount }) => {
    const matches = list.matches
    const placement= list.placement
  return (
    <div>
    <h1>{'Tournament: '}{tournament}{'| Event: '}{event}{' '}{entrantCount}{'| Placement:'}{placement}</h1>
      <OpponentList opponents={matches} />
    </div>
  );
};

export default TournamentResult;