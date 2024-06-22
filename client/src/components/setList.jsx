import React from 'react';
import Set from './set.jsx';
import Collapsible from './collapse.jsx';

const SetList = ({ sets, opponentName, headToHeadScore }) => {
  return (
    <div>
      <h1>Opponent: {opponentName}</h1>
      <h2>Head to Head Score: {headToHeadScore}</h2>
      {sets.map((set, index) => (
        <Collapsible key={index} title={`Set ${index + 1}`}>
          <Set type={set.type} matches={set.matches} />
        </Collapsible>
      ))}
    </div>
  );
};

export default SetList;