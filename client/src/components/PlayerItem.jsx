import React from 'react';
import { Link } from 'react-router-dom';
import trophy from '../assets/trophy.png';

const PlayerItem = ({ player, gameId, characterIcons }) => {
    let mostPlayed = 0
    let mostPlayedChar = "N/A"
    for (const game of player.games) {
        if (game.gameId === gameId) {
            for(const character of game.characters){
                if(character.numOfPlays > mostPlayed){
                    mostPlayedChar = character.characterName
                    mostPlayed = character.numOfPlays
                }
            }
            break;
        }
    }
    // Player records store only a character name; the art lives on the game
    // document, so the icon is looked up by name.
    const icon = characterIcons && characterIcons[mostPlayedChar]
        ? characterIcons[mostPlayedChar].stockIcon
        : null
    return (
        <div className="player-item">
            <img src={player.pfp} alt={`${player.gamerTag} logo`} className="player-logo" />
            <div className="player-info">
                <Link to={`${window.location.href}/${player._id}`}>
                    <h2>{player.gamerTag}</h2>
                </Link>
                <div className="player-details">
                    <div className="player-events">
                        <img src={trophy} alt="Trophy Icon" className="trophy-icon" /> {player.tournaments}
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
