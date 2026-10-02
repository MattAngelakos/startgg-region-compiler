import React, { useState, useEffect, useMemo } from 'react';
import './styles/styles.css';

// A control only. Filtering asks the server to rate the chosen players, so one
// implementation decides the numbers.
const PlayerFilter = ({ roster, selectedIds, onApply }) => {
    const [selected, setSelected] = useState([]);
    const [query, setQuery] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false);

    useEffect(() => {
        setSelected(selectedIds && selectedIds.length
            ? selectedIds
            : roster.map((player) => player.id));
    }, [roster, selectedIds]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? roster.filter((p) => p.tag.toLowerCase().includes(q)) : roster;
    }, [roster, query]);

    const toggle = (playerId) => {
        setSelected((previous) =>
            previous.includes(playerId)
                ? previous.filter((id) => id !== playerId)
                : [...previous, playerId]
        );
    };

    const selectAllVisible = () => {
        const ids = visible.map((p) => p.id);
        setSelected((previous) => [...new Set([...previous, ...ids])]);
    };
    const clearVisible = () => {
        const ids = new Set(visible.map((p) => p.id));
        setSelected((previous) => previous.filter((id) => !ids.has(id)));
    };

    const handleSubmit = async () => {
        setDropdownVisible(false);
        await onApply(selected);
    };

    const filtered = selected.length > 0 && selected.length < roster.length;
    const label = filtered ? `Players (${selected.length}/${roster.length})` : 'Select Players';

    return (
        <div className="filter-control">
            <button
                className={`button${filtered ? ' button-active' : ''}`}
                onClick={() => setDropdownVisible(!dropdownVisible)}
            >
                {label}
            </button>
            {dropdownVisible && (
                <div className="dropdown-content">
                    <div className="dropdown-toolbar">
                        <input
                            type="text"
                            className="dropdown-search"
                            placeholder="Search players"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button className="button dropdown-mini" onClick={selectAllVisible}>All</button>
                        <button className="button dropdown-mini" onClick={clearVisible}>None</button>
                    </div>
                    <div className="dropdown-list">
                        {visible.map((player) => (
                            <label key={player.id}>
                                <input
                                    type="checkbox"
                                    checked={selected.includes(player.id)}
                                    onChange={() => toggle(player.id)}
                                />
                                <span className="dropdown-label">{player.tag}</span>
                            </label>
                        ))}
                        {visible.length === 0 && <div className="dropdown-empty">No matches</div>}
                    </div>
                    <div className="dropdown-actions">
                        <span className="dropdown-count">{selected.length} of {roster.length} selected</span>
                        <button
                            className="button button-primary"
                            onClick={handleSubmit}
                            disabled={selected.length < 2}
                            title={selected.length < 2 ? 'Pick at least two players' : ''}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerFilter;
