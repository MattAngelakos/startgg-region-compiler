import React, { useState } from "react";
import { MapInteractionCSS } from 'react-map-interaction';
import './styles/styles.css';

const HeadToHeadChart = ({ data }) => {
    const [sortKey, setSortKey] = useState('elo'); // Default sorting by Elo
    const players = Object.keys(data);

    const sortedPlayers = players.sort((a, b) => data[b][sortKey] - data[a][sortKey]);

    return (
        <div>
            <div className="sort-options">
                <label>Sort by: </label>
                <select onChange={(e) => setSortKey(e.target.value)} value={sortKey}>
                    <option value="elo">Elo</option>
                    <option value="rating">Glicko2</option>
                </select>
            </div>
            <MapInteractionCSS minScale={0.5} maxScale={2} showControls={true}>
                <table className="head-to-head-table">
                    <thead>
                        <tr>
                            <th></th>
                            {sortedPlayers.map(player => (
                                <th key={player}>
                                    {player}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPlayers.map(player1 => (
                            <tr key={player1}>
                                <th>
                                    {player1}
                                    <div>Elo: {data[player1].elo.toFixed(2)}</div>
                                    <div>Glicko2: {data[player1].rating.toFixed(2)}±{data[player1].deviation.toFixed(2)}</div>
                                </th>
                                {sortedPlayers.map(player2 => {
                                    if (player1 === player2) {
                                        return <td key={player2} className="black-cell">-</td>;
                                    }

                                    const result = data[player1][player2];
                                    let cellClass;
                                    if (result.wins === result.losses) {
                                        if (result.wins === 0) {
                                            cellClass = 'gray-cell';
                                        } else {
                                            cellClass = 'yellow-cell';
                                        }
                                    } else if (result.wins < result.losses) {
                                        if (result.wins === 0) {
                                            cellClass = 'bright-red-cell';
                                        } else {
                                            cellClass = 'red-cell';
                                        }
                                    } else {
                                        if (result.losses === 0) {
                                            cellClass = 'dark-green-cell';
                                        } else {
                                            cellClass = 'green-cell';
                                        }
                                    }

                                    return (
                                        <td key={player2} className={cellClass}>
                                            {result.wins} - {result.losses}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </MapInteractionCSS>
        </div>
    );
};

export default HeadToHeadChart;
