import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import PlayerFilter from './PlayerFilter';

const HeadToHeadWrapper = () => {
    const { regionId, seasonName } = useParams();
    const [head2head, setHead2Head] = useState(null);
    useEffect(() => {
        const fetchRegionData = async () => {
            try {
                const response = await fetch(`/regions/${regionId}/seasons/${seasonName}/stats/head-to-head`);
                if (!response.ok) {
                    throw new Error('Failed to fetch region data');
                }
                const data = await response.json();
                setHead2Head(data.h2h)
            } catch (error) {
                console.error('Error fetching season data:', error);
            }
        };
        fetchRegionData();
    }, [regionId, seasonName]);
    if (!head2head) {
        return <div>Loading...</div>;
    }
    return (
        <div className="app">
            <Header />
            <main>
                <h1>League Head2Head Detail for {regionId}</h1>
                <PlayerFilter originalObject={head2head}/>
            </main>
        </div>
    );
}

export default HeadToHeadWrapper;