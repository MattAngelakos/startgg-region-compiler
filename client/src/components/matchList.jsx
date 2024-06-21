import React from 'react';
import MatchInfo from './matchDetails.jsx';
import Collapsible from './collapse.jsx';
const MatchList = ({ matches }) => {
  return (
    <div>
      {matches.map((match, index) => (
        <Collapsible
          key={index}
          title={`Match ${index + 1}`}
        >
          <MatchInfo matchDetails={match} />
        </Collapsible>
      ))}
    </div>
  );
};
export default MatchList;
