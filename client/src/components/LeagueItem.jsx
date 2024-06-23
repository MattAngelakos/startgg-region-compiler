import React from 'react';

const LeagueItem = ({ league }) => {
  return (
    <div className="league-item">
      <img src={league.image} alt={`${league.name} logo`} className="league-logo" />
      <div className="league-info">
        <h2>{league.name}</h2>
        <div className="league-details">
          <div className="league-game">
            <i className="game-icon" /> {league.game}
          </div>
          <div className="league-events">
            <i className="events-icon" /> {league.events}
          </div>
          <div className="league-players">
            <i className="players-icon" /> {league.players}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueItem;
