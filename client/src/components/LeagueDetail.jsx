import React from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
const LeagueDetail = () => {
    const { regionId } = useParams();
    return (
        <div className="app">
            <Header />
            <main>
                <h1>League Detail for {regionId}</h1>
            </main>
        </div>
    );
};

export default LeagueDetail;
