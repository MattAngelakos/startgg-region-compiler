import React, { useState, useEffect } from 'react';
import './styles/styles.css';

// A control only. It used to hold the chart and recompute Elo/Glicko-2 in the
// browser from a duplicate of the server's rating code; filtering now asks the
// server to rate the chosen players, so one implementation decides the numbers.
const PlayerFilter = ({ roster, selectedIds, onApply }) => {
    const [selected, setSelected] = useState([]);
    const [dropdownVisible, setDropdownVisible] = useState(false);

    useEffect(() => {
        setSelected(selectedIds && selectedIds.length
            ? selectedIds
            : roster.map((player) => player.id));
    }, [roster, selectedIds]);

    const handleCheckboxChange = (playerId) => {
        setSelected((previous) =>
            previous.includes(playerId)
                ? previous.filter((id) => id !== playerId)
                : [...previous, playerId]
        );
    };

    const handleSubmit = async () => {
        setDropdownVisible(false);
        await onApply(selected);
    };

    return (
        <div className="filter-control">
            <button className="button" onClick={() => setDropdownVisible(!dropdownVisible)}>
                Select Players
            </button>
            {dropdownVisible && (
                <div className="dropdown-content">
                    {roster.map((player) => (
                        <label key={player.id}>
                            <input
                                type="checkbox"
                                value={player.id}
                                checked={selected.includes(player.id)}
                                onChange={() => handleCheckboxChange(player.id)}
                            />
                            {player.tag}
                        </label>
                    ))}
                    <button className="button button-primary" onClick={handleSubmit}>Submit</button>
                </div>
            )}
        </div>
    );
};

export default PlayerFilter;
