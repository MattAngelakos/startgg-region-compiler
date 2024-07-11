import React from 'react';
import OpponentTournamentList from './OpponentTournamentList.jsx';
import { calculateScore } from '../helpers.js';

const OpponentItem = ({ opponent, tournaments }) => {
  const { score } = calculateScore(opponent.tournaments);

  return (
    <div>
        <h2>{opponent.opponentName} (Score: {score})</h2>
        <OpponentTournamentList tournaments={opponent.tournaments} brackets={tournaments} />
    </div>
  );
};

export default OpponentItem;