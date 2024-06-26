import React from "react";
import { MapInteractionCSS } from 'react-map-interaction';
import './styles/styles.css';

const HeadToHeadChart = ({ data }) => {
    const players = Object.keys(data);
    return (
        <MapInteractionCSS minScale={0.5} maxScale={2} showControls={true}>
            <table className="head-to-head-table">
                <thead>
                    <tr>
                        <th></th>
                        {players.map(player => (
                            <th key={player}>{player}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {players.map(player1 => (
                        <tr key={player1}>
                            <th>{player1}</th>
                            {players.map(player2 => {
                                if (player1 === player2) {
                                    return <td key={player2} className="black-cell">-</td>;
                                }

                                const result = data[player1][player2];
                                let cellClass
                                if (result.wins === result.losses) {
                                    if (result.wins === 0) {
                                        cellClass = 'gray-cell'
                                    }
                                    else {
                                        cellClass = 'yellow-cell'
                                    }
                                }
                                else if (result.wins < result.losses) {
                                    if (result.wins === 0) {
                                        cellClass = 'bright-red-cell'
                                    }
                                    else {
                                        cellClass = 'red-cell'
                                    }
                                }
                                else {
                                    if (result.losses === 0) {
                                        cellClass = 'dark-green-cell'
                                    }
                                    else {
                                        cellClass = 'green-cell'
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
    );
};

export default HeadToHeadChart;
