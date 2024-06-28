import React, { useState, useEffect } from 'react';
import './styles/styles.css';
import HeadToHeadChart from './HeadToHeadChart';
import { do_elo, do_glicko2, finish_h2h } from '../helpers';

const PlayerFilter = ({ originalObject, originalH2H }) => {
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [filteredObject, setFilteredObject] = useState({});
    const [dropdownVisible, setDropdownVisible] = useState(false);

    useEffect(() => {
        setSelectedPlayers(Object.keys(originalObject));
        setFilteredObject(originalObject);
    }, [originalObject]);

    const handleCheckboxChange = (player) => {
        setSelectedPlayers((prevSelectedPlayers) =>
            prevSelectedPlayers.includes(player)
                ? prevSelectedPlayers.filter((p) => p !== player)
                : [...prevSelectedPlayers, player]
        );
    };

    const handleSubmit = () => {
        let newFilteredObject = Object.keys(originalH2H)
            .filter((key) => selectedPlayers.includes(key))
            .reduce((obj, key) => {
                let filteredNestedObject = Object.keys(originalH2H[key])
                    .filter((nestedKey) => selectedPlayers.includes(nestedKey) || nestedKey === 'elo' || nestedKey === 'rating' || nestedKey === 'deviation' || nestedKey === 'id' || nestedKey === 'volatility')
                    .reduce((nestedObj, nestedKey) => {
                        nestedObj[nestedKey] = originalH2H[key][nestedKey];
                        return nestedObj;
                    }, {});

                obj[key] = filteredNestedObject;
                return obj;
            }, {});
        newFilteredObject = do_elo(newFilteredObject)
        newFilteredObject = do_glicko2(newFilteredObject)
        newFilteredObject = finish_h2h(newFilteredObject)
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
            <HeadToHeadChart data={filteredObject} />
        </div>
    );
};

export default PlayerFilter;
