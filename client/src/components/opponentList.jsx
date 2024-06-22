import React from 'react';
import SetList from './setList.jsx';
import Collapsible from './collapse.jsx';

const OpponentList = ({ opponents }) => {
  return (
    <div>
      {opponents.map((opponent, index) => {
        const headToHeadScore = opponent.headToHeadScore ?? ''; // Replace null with an empty string
        return (
          <Collapsible
            key={index}
            title={`${opponent.opponentName}`}
          >
            <SetList
              opponentName={opponent.opponentName}
              headToHeadScore={headToHeadScore}
              sets={opponent.tournaments}
            />
          </Collapsible>
        );
      })}
    </div>
  );
};

export default OpponentList;
