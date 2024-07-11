import React from 'react';
import { Link } from 'react-router-dom';
import calendar from '../assets/calenda.png';
import person from '../assets/person.png';
import trophy from '../assets/trophy.png'
import { formatDate } from '../helpers';

const TournamentItem = ({ tournament, event, placement }) => {
    const startDate = new Date(event.startAt * 1000);
    const formattedStartDate = formatDate(startDate);
    return (
        <div className="tournament-item">
            <img src={tournament.banner} alt={`${tournament.tournamentName} logo`} className="tournament-logo" />
            <div className="tournament-info">
                <Link to={`${window.location.href}/${event.eventId}`}>
                    <h2>{tournament.tournamentName}: {event.eventName}</h2>
                </Link>
                <div className="tournament-details">
                    <div className="tournament-time">
                        <img src={trophy} alt="Placement Icon" className="placement-icon" /> {placement}
                    </div>
                    <div className="tournament-time">
                        <img src={calendar} alt="Events Icon" className="events-icon" /> {formattedStartDate}
                    </div>
                    <div className="tournament-players">
                        <img src={person} alt="Players Icon" className="players-icon" /> {event.entrants}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TournamentItem;
