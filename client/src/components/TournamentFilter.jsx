import React, { useState, useMemo } from 'react';
import './styles/styles.css';

const formatDay = (startAt) =>
    startAt ? new Date(startAt * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

// Keyed by eventId rather than bracket name: names are display text and two
// events can share one. The parent is told which events to EXCLUDE.
const TournamentFilter = ({ tournaments, filterh2h }) => {
    const allIds = useMemo(() => tournaments.map((t) => t.eventId), [tournaments]);
    const [selected, setSelected] = useState(allIds);
    const [applied, setApplied] = useState(allIds);
    const [query, setQuery] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? tournaments.filter((t) => t.nameOfBracket.toLowerCase().includes(q)) : tournaments;
    }, [tournaments, query]);

    const toggle = (eventId) => {
        setSelected((previous) =>
            previous.includes(eventId)
                ? previous.filter((id) => id !== eventId)
                : [...previous, eventId]
        );
    };

    // All/None act on what the search is currently showing, so you can isolate
    // a series by searching for it and clicking None on everything else.
    const selectAllVisible = () => {
        const ids = visible.map((t) => t.eventId);
        setSelected((previous) => [...new Set([...previous, ...ids])]);
    };
    const clearVisible = () => {
        const ids = new Set(visible.map((t) => t.eventId));
        setSelected((previous) => previous.filter((id) => !ids.has(id)));
    };

    const handleSubmit = async () => {
        const excluded = tournaments.filter((t) => !selected.includes(t.eventId));
        setApplied(selected);
        setDropdownVisible(false);
        await filterh2h(excluded);
    };

    const excludedCount = tournaments.length - applied.length;
    const label = excludedCount > 0
        ? `Tournaments (${applied.length}/${tournaments.length})`
        : 'Select Tournaments';

    return (
        <div className="filter-control">
            <button
                className={`button${excludedCount > 0 ? ' button-active' : ''}`}
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
                            placeholder="Search tournaments"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button className="button dropdown-mini" onClick={selectAllVisible}>All</button>
                        <button className="button dropdown-mini" onClick={clearVisible}>None</button>
                    </div>
                    <div className="dropdown-list">
                        {visible.map((tournament) => (
                            <label
                                key={tournament.eventId}
                                // Most events in a season contain no sets between two
                                // roster members, so toggling them changes nothing.
                                // Saying so beats looking broken.
                                className={tournament.sets ? '' : 'dropdown-inert'}
                                title={tournament.sets ? '' : 'No sets between players on this roster'}
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.includes(tournament.eventId)}
                                    onChange={() => toggle(tournament.eventId)}
                                />
                                <span className="dropdown-label">{tournament.nameOfBracket}</span>
                                <span className="dropdown-meta">
                                    {formatDay(tournament.startAt)} · {tournament.sets || 0} set{tournament.sets === 1 ? '' : 's'}
                                </span>
                            </label>
                        ))}
                        {visible.length === 0 && <div className="dropdown-empty">No matches</div>}
                    </div>
                    <div className="dropdown-actions">
                        <span className="dropdown-count">{selected.length} of {tournaments.length} selected</span>
                        <button className="button button-primary" onClick={handleSubmit}>Apply</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentFilter;
