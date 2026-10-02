import React from 'react';
import { Link } from 'react-router-dom';
import trophy from '../assets/trophy.png';

const PlayerItem = ({ player, gameId, characterIcons, seasonPath }) => {
    let mostPlayedChar = player.mainCharacter || "N/A"
    if (!player.mainCharacter && Array.isArray(player.games)) {
        let mostPlayed = 0
        for (const game of player.games) {
            if (game.gameId === gameId) {
                for (const character of game.characters) {
                    if (character.numOfPlays > mostPlayed) {
                        mostPlayedChar = character.characterName
                        mostPlayed = character.numOfPlays
                    }
                }
                break;
            }
        }
    }
    const brackets = player.brackets ?? player.tournaments
    // Player records store only a character name; the art lives on the game
    // document, so the icon is looked up by name.
    const icon = characterIcons && characterIcons[mostPlayedChar]
        ? characterIcons[mostPlayedChar].stockIcon
        : null
    return (
        <div className="player-item">
            <img src={player.pfp} alt={`${player.gamerTag} logo`} className="player-logo" />
            <div className="player-info">
                {/* window.location.href is an absolute URL including the
                    origin; Link wants a path, and it broke whenever the current
                    URL had a trailing segment. */}
                <Link to={seasonPath ? `${seasonPath}/${player._id}` : `/players/${player._id}`}>
                    <h2>{player.gamerTag}</h2>
                </Link>
                <div className="player-details">
                    {player.glicko !== undefined && (
                        <div className="player-rating">
                            <span className="rating-label">Glicko-2</span>
                            <span className="rating-value">{player.glicko.toFixed(1)}</span>
                            {player.deviation !== undefined && (
                                <span className="rating-dev">±{player.deviation.toFixed(0)}</span>
                            )}
                        </div>
                    )}
                    {player.elo !== undefined && (
                        <div className="player-rating">
                            <span className="rating-label">Elo</span>
                            <span className="rating-value">{player.elo.toFixed(1)}</span>
                        </div>
                    )}
                    <div className="player-events" title="Brackets entered this season">
                        <img src={trophy} alt="Trophy Icon" className="trophy-icon" /> {brackets}
                    </div>
                    <div className="player-character">
                        {icon && (
                            <img src={icon} alt={mostPlayedChar} className="character-icon" />
                        )}
                        {mostPlayedChar}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerItem;
