import React from 'react';
import { Link } from 'react-router-dom';
import trophy from '../assets/trophy.png';

const PlayerItem = ({ player, gameId }) => {
    let tournaments = 0;
    for (const game of player.games) {
        if (game.gameId === gameId) {
            tournaments = game.tournaments.length;
            break;
        }
    }

    return (
        <div className="player-item">
            <img src={player.image} alt={`${player.gamerTag} logo`} className="player-logo" />
            <div className="player-info">
                <Link to={`${window.location.href}/${player._id}`}>
                    <h2>{player.gamerTag}</h2>
                </Link>
                <div className="player-details">
                    <div className="league-events">
                        <img src={trophy} alt="Trophy Icon" className="trophy-icon" /> {tournaments}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerItem;
