import React from 'react';
import { Link } from 'react-router-dom';
import calendar from '../assets/calenda.png';
import person from '../assets/person.png';

const SeasonItem = ({ regionId, season }) => {
  let players = season.players.length;
  const startDate = new Date(season.startDate * 1000);
  const endDate = new Date(season.endDate * 1000);
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  return (
    <div className="league-item">
      <img src={season.image} alt={`${season.seasonName} logo`} className="league-logo" />
      <div className="league-info">
        <Link to={`/regions/${regionId}/seasons/${season.seasonName}`}>
          <h2>{season.seasonName}</h2>
        </Link>
        <div className="league-details">
          <div className="league-events">
            <img src={calendar} alt="Events Icon" className="events-icon" /> {formattedStartDate}
          </div>
          <div className="league-events">
            {formattedEndDate}
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

