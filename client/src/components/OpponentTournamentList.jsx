import React, { useState } from 'react';
import MatchesList from './MatchesList';
import { formatDate } from '../helpers';

const OpponentTournamentList = ({ tournaments }) => {
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
        } else if (newOpenMatches.every((isOpen) => isOpen)) {
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
                        {tournament.tournamentName} ({tournament.type === 'win' ? 'W' : 'L'})
                    </h3>
                    <h4> {formatDate(new Date(tournament.startAt * 1000))} </h4>
                    {openMatches[index] && (
                        <div>
                            <MatchesList matches={tournament.matches} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default OpponentTournamentList;
