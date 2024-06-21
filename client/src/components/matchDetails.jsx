import React from 'react';

const MatchInfo = ({ matchDetails }) => {
  const displayType = matchDetails.type === 'win' ? 'W' : 'L';
  const typeColor = matchDetails.type === 'win' ? 'green' : 'red';
  return (
    <div>
      <h2><span style={{ color: typeColor }}>Game {matchDetails.matchNum }{': '}{displayType}
        </span></h2>
      <h3>Player Character: {matchDetails.playerChar}</h3>
      <h3>Opponent Character: {matchDetails.opponentChar}</h3>
      {matchDetails.stage !== 'N/A' && (
        <h3>Stage: {matchDetails.stage}</h3>
      )}
    </div>
  );
};

export default MatchInfo;