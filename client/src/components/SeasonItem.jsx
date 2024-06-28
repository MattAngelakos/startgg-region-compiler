import React from 'react';
import { Link, useParams } from 'react-router-dom';
import calendar from '../assets/calenda.png';
import person from '../assets/person.png';
import trophy from '../assets/trophy.png';
import { formatDate } from '../helpers';

const SeasonItem = ({ regionId, season }) => {
  const { seasonName: urlSeasonName } = useParams();
  let players = season.players.length;
  let tournaments = 0;

  for (const player of season.players) {
    for (const game of player.games) {
      if (game.gameId === season.gameId) {
        tournaments += game.tournaments.length;
        break;
      }
    }
  }

  const startDate = new Date(season.startDate * 1000);
  const endDate = new Date(season.endDate * 1000);

  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  return (
    <div className="league-item">
      <img src={season.image} alt={`${season.seasonName} logo`} className="league-logo" />
      <div className="league-info">
        {urlSeasonName ? (
          <h2>{season.seasonName}</h2>
        ) : (
          <Link to={`/regions/${regionId}/seasons/${season.seasonName}`}>
            <h2>{season.seasonName}</h2>
          </Link>
        )}
        <div className="league-details">
          <div className="league-time">
            <img src={calendar} alt="Events Icon" className="events-icon" /> {formattedStartDate}
          </div>
          <div className="league-time">
            {formattedEndDate}
          </div>
          <div className="league-events">
            <img src={trophy} alt="Trophy Icon" className="trophy-icon" /> {tournaments}
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
