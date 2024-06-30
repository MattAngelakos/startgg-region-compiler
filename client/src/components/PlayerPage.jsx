import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import GameItem from './GameItem';
import Results from './Results';

const PlayerPage = () => {
    const { playerId } = useParams();
    const [player, setPlayer] = useState(null);
    useEffect(() => {
        const fetchRegionData = async () => {
            try {
                const response = await fetch(`/players/${playerId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch region data');
                }
                const data = await response.json();
                setPlayer(data.player);
            } catch (error) {
                console.error('Error fetching region data:', error);
            }
        };
        fetchRegionData();
    }, [playerId]);
    const gamePropMapper = useCallback(
        (game) => ({
            gameId: game.gameId
        }),
        []
    );
    if (!player) {
        return <div>Loading...</div>;
    }
    for(let game of player.games){
        game._id = game.gameId
    }
    return (
        <div className="app">
            <Header link={`/players`}linkname={'Players'}/>
            <main>
                {player.gamerTag}
                <Results items={player.games} Component={GameItem} propMapper={gamePropMapper} type={player.games.gameId}/>
            </main>
        </div>
    );
}

export default PlayerPage;