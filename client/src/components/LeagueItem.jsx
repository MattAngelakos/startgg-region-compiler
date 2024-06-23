import React from 'react';

const LeagueItem = ({ league }) => {
  let players = 0
  let seasons = 0
  for(const season of league.seasons){
    players = players + season.players.length
    seasons = seasons + 1
  }
  return (
    <div className="league-item">
      <img src={league.image} alt={`${league.region} logo`} className="league-logo" />
      <div className="league-info">
        <h2>{league.regionName}</h2>
        <div className="league-details">
          <div className="league-game">
            <i className="game-icon" /> {league.gameId}
          </div>
          <div className="league-events">
            <i className="events-icon" /> {seasons}
          </div>
          <div className="league-players">
            <i className="players-icon" /> {players}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueItem;
