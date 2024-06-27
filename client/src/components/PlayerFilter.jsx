import React, { useState } from 'react';
import './styles/styles.css';
import HeadToHeadChart from './HeadToHeadChart'; 

const PlayerFilter = (originalObject) => {
    originalObject = originalObject.originalObject
    const [selectedPlayers, setSelectedPlayers] = useState(
        Object.keys(originalObject)
    );
    const [filteredObject, setFilteredObject] = useState(originalObject);
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const handleCheckboxChange = (player) => {
        setSelectedPlayers((prevSelectedPlayers) =>
            prevSelectedPlayers.includes(player)
                ? prevSelectedPlayers.filter((p) => p !== player)
                : [...prevSelectedPlayers, player]
        );
    };

    const handleSubmit = () => {
        const newFilteredObject = Object.keys(originalObject)
            .filter((key) => selectedPlayers.includes(key))
            .reduce((obj, key) => {
                obj[key] = originalObject[key];
                return obj;
            }, {});
        setFilteredObject(newFilteredObject);
        setDropdownVisible(false); 
    };

    return (
        <div>
            <button onClick={() => setDropdownVisible(!dropdownVisible)}>
                Select Players
            </button>
            {dropdownVisible && (
                <div className="dropdown-content">
                    {Object.keys(originalObject).map((player) => (
                        <label key={player}>
                            <input
                                type="checkbox"
                                value={player}
                                checked={selectedPlayers.includes(player)}
                                onChange={() => handleCheckboxChange(player)}
                            />
                            {player}
                        </label>
                    ))}
                    <button onClick={handleSubmit}>Submit</button>
                </div>
            )}
            <HeadToHeadChart data={filteredObject}/>
        </div>
    );
};

export default PlayerFilter;
