import React from 'react';

const MatchInfo = ({ matchDetails }) => {
  const displayType = matchDetails.type === 'win' ? 'W' : 'L';
  const typeColor = matchDetails.type === 'win' ? 'green' : 'red';
  return (
    <div>
      <h1><span style={{ color: typeColor }}>Game {matchDetails.matchNum }{': '}{displayType}
        </span></h1>
      <h2>Player Character: {matchDetails.playerChar}</h2>
      <h2>Opponent Character: {matchDetails.opponentChar}</h2>
      {matchDetails.stage !== 'N/A' && (
        <h2>Stage: {matchDetails.stage}</h2>
      )}
    </div>
  );
};

export default MatchInfo;