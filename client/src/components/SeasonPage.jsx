import React, { useState, useEffect, useCallback } from 'react';
import LoadingScreen from './LoadingScreen';
import { useParams } from 'react-router-dom';
import Header from './Header';
import Results from './Results';
import SeasonItem from './SeasonItem';
import LinkButton from './LinkButton';

const SeasonPage = () => {
    const { regionId, seasonName } = useParams();
    const [season, setSeason] = useState(null);
    const [region, setRegion] = useState(null);

    useEffect(() => {
        // The summary already carries this season's counts, so there is no need
        // to hydrate every player and every one of their tournaments here.
        const fetchSeason = async () => {
            try {
                const response = await fetch(`/regions/${regionId}/seasons-summary`);
                if (!response.ok) {
                    throw new Error('Failed to fetch season summaries');
                }
                const data = await response.json();
                const match = data.seasons.find(
                    (s) => s.seasonName.toLowerCase() === seasonName.toLowerCase()
                );
                if (!match) {
                    throw new Error(`season ${seasonName} not found`);
                }
                setRegion(data.region);
                setSeason(match);
            } catch (error) {
                console.error('Error fetching season data:', error);
            }
        };
        fetchSeason();
    }, [seasonName, regionId]);

    const seasonPropMapper = useCallback(
        (season) => ({
            _id: season.seasonName,
            regionId: regionId,
            season: season,
        }),
        [regionId]
    );

    if (!season || !region) {
        return <LoadingScreen label={"Loading season…"} rows={1} link={`/regions/${regionId}`} />;
    }

    return (
        <div className="app">
            <Header link={`/regions/${regionId}`} linkname={region.regionName} />
            <main>
                <h1>{region.regionName} &mdash; {season.seasonName}</h1>
                <Results
                    items={[{ ...season, _id: season.seasonName }]}
                    Component={SeasonItem}
                    propMapper={seasonPropMapper}
                />
                <div className="button-grid">
                    <LinkButton to="/h2h-chart">H2H Chart</LinkButton>
                    <LinkButton to="/players">Search Players</LinkButton>
                    <LinkButton to="/tournaments">Search Tournaments</LinkButton>
                </div>
            </main>
        </div>
    );
}

export default SeasonPage;
