import React from 'react';
import OpponentTournanemtList from './OpponentTournamentList.jsx';

const OpponentItem = ({ opponent }) => {
  return (
    <div>
        <h2>{opponent.opponentName} (ID: {opponent.opponentId})</h2>
        <OpponentTournanemtList tournaments={opponent.tournaments} />
    </div>
  );
};

export default OpponentItem;