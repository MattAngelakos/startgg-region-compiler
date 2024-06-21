import React from 'react';
import SetList from './setList.jsx';
import Collapsible from './collapse.jsx';

const OpponentList = ({ opponents }) => {
  return (
    <div>
      {opponents.map((opponent, index) => (
        <Collapsible
          key={index}
          title={`${opponent.opponentName}`}
        >
          <SetList
            opponentName={opponent.opponentName}
            headToHeadScore={opponent.headToHeadScore}
            sets={opponent.sets}
          />
        </Collapsible>
      ))}
    </div>
  );
};

export default OpponentList;
