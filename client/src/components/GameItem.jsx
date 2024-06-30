import React from 'react';
import { Link } from 'react-router-dom';

const GameItem = ({ gameId }) => {
    //eventually write the game routes
    return (
        <div className="game-item">
            <div className="game-info">
                <Link to={`${window.location.href}/games/${gameId}`}>
                    <h2>{gameId}</h2>
                </Link>
            </div>
        </div>
    );
};

export default GameItem;
