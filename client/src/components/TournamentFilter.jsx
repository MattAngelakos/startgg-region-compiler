import React, { useState } from 'react';
import './styles/styles.css';

const TournamentFilter = ({ tournaments, filterh2h }) => {
    const [selectedTournaments, setSelectedTournaments] = useState(
        tournaments.map(tournament => tournament.nameOfBracket)
    );
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const handleCheckboxChange = (bracketName) => {
        setSelectedTournaments(prevSelectedTournaments =>
            prevSelectedTournaments.includes(bracketName)
                ? prevSelectedTournaments.filter(name => name !== bracketName)
                : [...prevSelectedTournaments, bracketName]
        );
    };
    const handleSubmit = async () => {
        const newFilteredArray = tournaments.filter(tournament =>
            selectedTournaments.includes(tournament.nameOfBracket)
        );
        await filterh2h(newFilteredArray);
        setDropdownVisible(false);
    };

    return (
        <div>
            <button onClick={() => setDropdownVisible(!dropdownVisible)}>
                Select Tournaments
            </button>
            {dropdownVisible && (
                <div className="dropdown-content">
                    {tournaments.map(tournament => (
                        <label key={tournament.nameOfBracket}>
                            <input
                                type="checkbox"
                                value={tournament.nameOfBracket}
                                checked={selectedTournaments.includes(tournament.nameOfBracket)}
                                onChange={() => handleCheckboxChange(tournament.nameOfBracket)}
                            />
                            {tournament.nameOfBracket}
                        </label>
                    ))}
                    <button onClick={handleSubmit}>Submit</button>
                </div>
            )}
        </div>
    );
};

export default TournamentFilter;
