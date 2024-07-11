import React, { useState } from 'react';

const calculateScore = (matches) => {
    let wins = 0;
    let losses = 0;

    matches.forEach(match => {
        if (match.type === 'win') {
            wins += 1;
        } else if (match.type === 'loss') {
            losses += 1;
        }
    });

    return { score: `${wins}-${losses}` };
};

const MatchesList = ({ matches }) => {
    const { score } = calculateScore(matches);
    const [openMatches, setOpenMatches] = useState(matches.map(() => false));
    const [allOpen, setAllOpen] = useState(false);

    const toggleAllMatches = () => {
        const newAllOpen = !allOpen;
        setAllOpen(newAllOpen);
        setOpenMatches(matches.map(() => newAllOpen));
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
            <h4>Matches (Score: {score}):</h4>
            <button onClick={toggleAllMatches}>
                {allOpen ? 'Collapse All' : 'Expand All'}
            </button>
            <ul>
                {matches.map((match, index) => (
                    <div key={index}>
                        <h3 onClick={() => toggleMatchDetails(index)}>
                            Match {index + 1} ({match.type === 'win' ? 'W' : 'L'})
                        </h3>
                        {openMatches[index] && (
                            <div>
                                <p>Player Character: {match.playerChar}</p>
                                <p>Opponent Character: {match.opponentChar}</p>
                                <p>Stage: {match.stage}</p>
                                <p>Type: {match.type}</p>
                            </div>
                        )}
                    </div>
                ))}
            </ul>
        </div>
    );
};

export default MatchesList;
