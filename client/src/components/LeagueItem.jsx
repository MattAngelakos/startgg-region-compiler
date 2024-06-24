import React from 'react';
import { Link } from 'react-router-dom';
import calendar from '../assets/calenda.png';
import game from '../assets/controlla.png';
import person from '../assets/person.png';

const LeagueItem = ({ league }) => {
  let players = 0;
  let seasons = 0;
  for (const season of league.seasons) {
    players += season.players.length;
    seasons += 1;
  }
  return (
    <div className="league-item">
      <img src={league.image} alt={`${league.region} logo`} className="league-logo" />
      <div className="league-info">
        <Link to={`/regions/${league._id}`}>
          <h2>{league.regionName}</h2>
        </Link>
        <div className="league-details">
          <div className="league-game">
            <img src={game} alt="Game Icon" className="game-icon" /> {league.gameId}
          </div>
          <div className="league-events">
            <img src={calendar} alt="Events Icon" className="events-icon" /> {seasons}
          </div>
          <div className="league-players">
            <img src={person} alt="Players Icon" className="players-icon" /> {players}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueItem;
