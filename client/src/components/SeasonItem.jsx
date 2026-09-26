import React from 'react';
import { Link, useParams } from 'react-router-dom';
import calendar from '../assets/calenda.png';
import person from '../assets/person.png';
import trophy from '../assets/trophy.png';
import { formatDate } from '../helpers';

const SeasonItem = ({ regionId, season }) => {
  const { seasonName: urlSeasonName } = useParams();

  // Counts come from the season summary. Older callers passed hydrated player
  // documents instead, so fall back to counting those.
  let players = season.playerCount;
  let tournaments = season.tournamentCount;
  if (players === undefined && Array.isArray(season.players)) {
    players = season.players.length;
    tournaments = 0;
    for (const player of season.players) {
      for (const game of player.games || []) {
        if (game.gameId === season.gameId) {
          tournaments += game.tournaments.length;
          break;
        }
      }
    }
  }

  const formattedStartDate = formatDate(new Date(season.startDate * 1000));
  const formattedEndDate = formatDate(new Date(season.endDate * 1000));
  const seasonPath = `/regions/${regionId}/seasons/${season.seasonName}`;

  return (
    <div className="league-item">
      <img src={season.image} alt={`${season.seasonName} logo`} className="league-logo" />
      <div className="league-info">
        {urlSeasonName ? (
          <h2>{season.seasonName}</h2>
        ) : (
          <Link to={seasonPath}>
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
        {!urlSeasonName && (
          // Straight to the chart from the season list, instead of going
          // through the season page first.
          <div className="season-shortcuts">
            <Link to={`${seasonPath}/h2h-chart`} className="link-button">
              <button className="button">H2H Chart</button>
            </Link>
            <Link to={`${seasonPath}/players`} className="link-button">
              <button className="button">Players</button>
            </Link>
            <Link to={`${seasonPath}/tournaments`} className="link-button">
              <button className="button">Tournaments</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonItem;
