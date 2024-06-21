import React from 'react';
import MatchList from './matchList.jsx';

const Set = ({ type, tournament, event, score, matches }) => {
  const setResult = type === 'win' ? 'W' : 'L';
  const resultColor = type === 'win' ? 'green' : 'red';

  return (
    <div>
      <h1 style={{ color: resultColor }}>{'Tournament: '}{tournament}{'| Event: '}{event} {'| Score:'}{score}</h1>
      <MatchList matches={matches} />
    </div>
  );
};

export default Set;