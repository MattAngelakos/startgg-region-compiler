import React, { useState, useRef, useEffect, useCallback } from "react";
import * as Popover from '@radix-ui/react-popover';
import { Cross2Icon } from '@radix-ui/react-icons';
import './styles/styles.css';

const ZOOM_MIN = 0.6;
const ZOOM_MAX = 1.8;
const ZOOM_STEP = 0.1;

// Win/loss colouring, shared by the matrix cells and the popover rows.
const resultClass = (result) => {
    if (result.wins === result.losses) {
        return result.wins === 0 ? 'gray-cell' : 'yellow-cell';
    }
    if (result.wins < result.losses) {
        return result.wins === 0 ? 'bright-red-cell' : 'red-cell';
    }
    return result.losses === 0 ? 'dark-green-cell' : 'green-cell';
};

const HeadToHeadChart = ({ data }) => {
    const [sortKey, setSortKey] = useState('elo'); // Default sorting by Elo
    const [zoom, setZoom] = useState(1);
    const scrollRef = useRef(null);

    const players = Object.keys(data);
    const sortedPlayers = players.sort((a, b) => data[b][sortKey] - data[a][sortKey]);

    const clamp = (value) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100));
    const zoomBy = useCallback((delta) => setZoom((z) => clamp(z + delta)), []);

    // Ctrl/Cmd + wheel zooms, like every other zoomable surface. A plain wheel
    // is left alone so the table just scrolls. The listener is non-passive and
    // attached manually because React's onWheel is passive and cannot
    // preventDefault the browser's own page zoom.
    useEffect(() => {
        const node = scrollRef.current;
        if (!node) return undefined;
        const onWheel = (e) => {
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            zoomBy(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
        };
        node.addEventListener('wheel', onWheel, { passive: false });
        return () => node.removeEventListener('wheel', onWheel);
    }, [zoomBy]);

    return (
        <div className="chart-body">
            <div className="sort-options">
                <label htmlFor="h2h-sort">Sort by: </label>
                <select id="h2h-sort" onChange={(e) => setSortKey(e.target.value)} value={sortKey}>
                    <option value="elo">Elo</option>
                    <option value="rating">Glicko2</option>
                </select>

                <div className="zoom-controls" role="group" aria-label="Zoom">
                    <button
                        type="button"
                        className="button zoom-button"
                        onClick={() => zoomBy(-ZOOM_STEP)}
                        disabled={zoom <= ZOOM_MIN}
                        aria-label="Zoom out"
                    >
                        &minus;
                    </button>
                    <button
                        type="button"
                        className="button zoom-reset"
                        onClick={() => setZoom(1)}
                        aria-label="Reset zoom"
                    >
                        {Math.round(zoom * 100)}%
                    </button>
                    <button
                        type="button"
                        className="button zoom-button"
                        onClick={() => zoomBy(ZOOM_STEP)}
                        disabled={zoom >= ZOOM_MAX}
                        aria-label="Zoom in"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Scroll container rather than a pan/zoom surface: the table is
                wide data, so the browser's own scrolling is the right gesture
                and it keeps the overflow inside this box instead of pushing the
                whole page sideways. Zoom scales font-size, not transform, so
                the sticky headers below keep working. */}
            <div className="chart-scroll" ref={scrollRef} style={{ fontSize: `${zoom * 0.86}rem` }}>
                <table className="head-to-head-table">
                    <thead>
                        <tr>
                            <th className="corner-header">Tag / Score</th>
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
                                <th className="row-header">
                                    <Popover.Root>
                                        <Popover.Trigger asChild>
                                            <button type="button" aria-label={`${player1} record`}>
                                                {player1}
                                                <div>Elo: {data[player1].elo.toFixed(2)}</div>
                                                <div>Glicko2: {data[player1].rating.toFixed(2)}±{data[player1].deviation.toFixed(2)}</div>
                                            </button>
                                        </Popover.Trigger>
                                        <Popover.Portal>
                                            <Popover.Content
                                                className="PopoverContent"
                                                side="right"
                                                align="start"
                                                sideOffset={5}
                                                collisionPadding={12}
                                            >
                                                <div className="popover-title">{player1}</div>
                                                {sortedPlayers.map(player2 => {
                                                    if (player1 === player2) {
                                                        return null;
                                                    }
                                                    const result = data[player1][player2];
                                                    return (
                                                        <div key={player2} className="popover-row">
                                                            <div className="popover-player">{player2}</div>
                                                            <div className={resultClass(result) + ' popover-result'}>{result.wins} - {result.losses}</div>
                                                        </div>
                                                    );
                                                })}
                                                <Popover.Close className="PopoverClose" aria-label="Close">
                                                    <Cross2Icon />
                                                </Popover.Close>
                                                <Popover.Arrow className="PopoverArrow" />
                                            </Popover.Content>
                                        </Popover.Portal>
                                    </Popover.Root>
                                </th>
                                {sortedPlayers.map(player2 => {
                                    if (player1 === player2) {
                                        return <td key={player2} className="black-cell">-</td>;
                                    }
                                    const result = data[player1][player2];
                                    return (
                                        <td key={player2} className={resultClass(result)}>
                                            {result.wins} - {result.losses}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HeadToHeadChart;
