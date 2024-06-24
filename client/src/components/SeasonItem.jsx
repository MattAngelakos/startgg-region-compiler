import React from 'react';
import { Link } from 'react-router-dom';
import calendar from '../assets/calenda.png';
import person from '../assets/person.png';

const SeasonItem = ({ regionId, season }) => {
  let players = season.players.length;
  return (
    <div className="league-item">
      <img src={season.image} alt={`${season.seasonName} logo`} className="league-logo" />
      <div className="league-info">
        <Link to={`/regions/${regionId}/seasons/${season.seasonName}`}>
          <h2>{season.seasonName}</h2>
        </Link>
        <div className="league-details">
          <div className="league-events">
            <img src={calendar} alt="Events Icon" className="events-icon" /> {season.startDate}
          </div>
          <div className="league-players">
            <img src={person} alt="Players Icon" className="players-icon" /> {players}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonItem;
