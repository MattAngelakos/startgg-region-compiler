import React, { useState } from 'react';
import Collapsible from 'react-collapsible';

const CharacterRender = ({ data, sortCriteria, gameData }) => {
    const [expandedLevels, setExpandedLevels] = useState({});
    const [individualStates, setIndividualStates] = useState({});
    const getCharacterImage = (name, type) => {
        const character = gameData.characters.find(char => char.name === name);
        if (!character) return null;
        const image = character.images.find(img => img.type === type);
        return image ? image.url : null;
    };
    const toggleExpandLevel = (level) => {
        setExpandedLevels((prev) => ({
            ...prev,
            [level]: !prev[level],
        }));

        setIndividualStates((prev) => {
            const newStates = { ...prev };
            Object.keys(newStates).forEach((key) => {
                if (key.startsWith(`${level}-`)) {
                    newStates[key] = !prev[level];
                }
            });
            return newStates;
        });
    };

    const toggleIndividualState = (depth, key) => {
        setIndividualStates((prev) => ({
            ...prev,
            [`${depth}-${key}`]: !prev[`${depth}-${key}`],
        }));
    };

    const characterRender = (obj, depth = 0, prevKey = null) => {
        const sortedKeys = Object.keys(obj).sort((a, b) => {
            if (!sortCriteria) return 0;
            const valueA = obj[a];
            const valueB = obj[b];
            switch (sortCriteria) {
                case 'name':
                    return a.localeCompare(b); 
                case '-name':
                    return b.localeCompare(a); 
                case 'plays':
                    return (valueB.plays || 0) - (valueA.plays || 0);
                case '-plays':
                    return (valueA.plays || 0) - (valueB.plays || 0);
                case 'winrate':
                    return (valueB.winrate || 0) - (valueA.winrate || 0);
                case '-winrate':
                    return (valueA.winrate || 0) - (valueB.winrate || 0);
                default:
                    return 0;
            }
        });

        return (
            <div>
                {depth === 0 && (
                    <button onClick={() => toggleExpandLevel(depth)}>
                        {expandedLevels[depth] ? 'Collapse All' : 'Expand All'}
                    </button>
                )}
                {sortedKeys.map((key) => {
                    if (key === "N/A") return null;
                    const value = obj[key];
                    const hasChildren = value && typeof value === 'object' && Object.keys(value).length > 0;
                    const characterImage = getCharacterImage(key, "stockIcon");

                    const isOpen = individualStates[`${depth}-${key}`] !== undefined ? individualStates[`${depth}-${key}`] : expandedLevels[depth];

                    return (
                        <div key={key} style={{ marginLeft: depth * 20 }}>
                            {hasChildren || key === 'stages' ? (
                                <Collapsible
                                    open={isOpen}
                                    trigger={
                                        <div onClick={() => toggleIndividualState(depth, key)}>
                                            {characterImage && <img src={characterImage} alt={key} style={{ width: 20, marginRight: 10 }} />}
                                            {key === 'stages' ? (
                                                hasChildren && <span>{`${key}`}</span>
                                            ) : (
                                                <span>{`${key} (${value.plays} plays, ${Math.round(value.winrate * 100)}% winrate)`}</span>
                                            )}
                                        </div>
                                    }
                                >
                                    {prevKey !== 'stages' && characterRender(value, depth + 1, key)}
                                </Collapsible>
                            ) : (
                                <div>
                                    {characterImage && <img src={characterImage} alt={key} style={{ width: 20, marginRight: 10 }} />}
                                    {`${key}: ${value}`}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return characterRender(data);
};

export default CharacterRender;
