import React, { useState } from 'react';
import MatchesList from './MatchesList';

const OpponentTournanemtList = ({ tournaments }) => {
    const [openMatches, setOpenMatches] = useState(tournaments.map(() => false));
    const [allOpen, setAllOpen] = useState(false);
    const toggleAllMatches = () => {
        const newAllOpen = !allOpen;
        setAllOpen(newAllOpen);
        setOpenMatches(tournaments.map(() => newAllOpen));
    };

    const toggleMatchDetails = (index) => {
        const newOpenMatches = [...openMatches];
        newOpenMatches[index] = !newOpenMatches[index];
        setOpenMatches(newOpenMatches);
        if (newOpenMatches.some((isOpen) => !isOpen)) {
            setAllOpen(false);
        }
        else if (newOpenMatches.every((isOpen) => isOpen)) {
            setAllOpen(true);
        }
    };
    return (
        <div>
            <button onClick={toggleAllMatches}>
                {allOpen ? 'Collapse All' : 'Expand All'}
            </button>
            {tournaments.map((tournament, index) => (
                <div key={index}>
                    <h3 onClick={() => toggleMatchDetails(index)}>
                        Tournament {index + 1} ({tournament.type === 'win' ? 'W' : 'L'})
                    </h3>
                    {openMatches[index] && (
                        <div>
                            <p>Tournament ID: {tournament.tournamentId}</p>
                            <p>Event ID: {tournament.eventId}</p>
                            <MatchesList matches={tournament.matches} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default OpponentTournanemtList;
