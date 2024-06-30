import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import TournamentFilter from './TournamentFilter';
import PlayerFilter from './PlayerFilter';

const HeadToHeadWrapper = () => {
    const { regionId, seasonName } = useParams();
    const [head2head, setHead2Head] = useState(null);
    const [originalH2H, setOriginalHead2Head] = useState(null);
    const [tournaments, setTournaments] = useState([]);

    useEffect(() => {
        const fetchRegionData = async () => {
            try {
                const response = await fetch(`/regions/${regionId}/seasons/${seasonName}/stats/head-to-head`);
                if (!response.ok) {
                    throw new Error('Failed to fetch region data');
                }
                const data = await response.json();
                setHead2Head(data.h2h);
                setOriginalHead2Head(data.unfinished_h2h)
            } catch (error) {
                console.error('Error fetching head-to-head data:', error);
            }
        };

        const fetchTournaments = async () => {
            try {
                const response = await fetch(`/regions/${regionId}/seasons/${seasonName}/tournaments`);
                if (!response.ok) {
                    throw new Error('Failed to fetch regional tournament data');
                }
                const data = await response.json();
                setTournaments(data.results);
            } catch (error) {
                console.error('Error fetching tournaments data:', error);
            }
        };

        fetchRegionData();
        fetchTournaments();
    }, [regionId, seasonName]);

    const filterh2h = async (filteredTournaments) => {
        try {
            let eventIds = filteredTournaments.map(tournament => tournament.eventId);
            const response = await fetch(`/regions/${regionId}/seasons/${seasonName}/stats/head-to-head`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tournaments: eventIds }),
            });
            if (!response.ok) {
                throw new Error('Failed to fetch filtered head-to-head data');
            }
            const data = await response.json();
            setHead2Head(data.h2h)
            setOriginalHead2Head(data.originalH2H)
        } catch (error) {
            console.error('Error fetching filtered head-to-head data:', error);
        }
    };

    if (!head2head || tournaments.length === 0) {
        return <div>Loading...</div>;
    }

    return (
        <div className="app">
            <Header link={`/regions/${regionId}/seasons/${seasonName}`}linkname={seasonName}/>
            <main>
                <h1>League Head2Head Detail for {regionId}</h1>
                <TournamentFilter
                    tournaments={tournaments}
                    filterh2h={filterh2h}
                />
                <PlayerFilter originalObject={head2head} originalH2H={originalH2H}/>
            </main>
        </div>
    );
};

export default HeadToHeadWrapper;
