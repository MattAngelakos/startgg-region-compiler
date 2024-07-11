import React, { useState, useEffect } from 'react';
import MatchesList from './MatchesList';

const OpponentTournamentList = ({ tournaments, brackets }) => {
    const [openMatches, setOpenMatches] = useState(tournaments.map(() => false));
    const [allOpen, setAllOpen] = useState(false);
    const addTournamentNames = (tournaments, brackets) => {
        return tournaments.map(tournament => {
            const bracket = brackets.find(bracket =>
                bracket.tournament._id === tournament.tournamentId &&
                bracket.event.eventId === tournament.eventId
            );
            return {
                ...tournament,
                tournamentName: bracket ? `${bracket.tournament.tournamentName}: ${bracket.event.eventName}` : 'Unknown Tournament'
            };
        });
    };

    const enrichedTournaments = addTournamentNames(tournaments, brackets);

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
            {enrichedTournaments.map((tournament, index) => (
                <div key={index}>
                    <h3 onClick={() => toggleMatchDetails(index)}>
                        {tournament.tournamentName} ({tournament.type === 'win' ? 'W' : 'L'})
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

export default OpponentTournamentList;
