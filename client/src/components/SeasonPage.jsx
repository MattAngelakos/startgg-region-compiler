import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import Results from './Results';
import SeasonItem from './SeasonItem';
import LinkButton from './LinkButton';

const SeasonPage = () => {
    const { regionId, seasonName } = useParams();
    const [season, setSeason] = useState(null);
    useEffect(() => {
        const fetchRegionData = async () => {
            try {
                let region
                try {
                    const response = await fetch(`/regions/${regionId}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch region data');
                    }
                    const data = await response.json();
                    region = data.region
                } catch (error) {
                    console.error('Error fetching region data:', error);
                }
                const response = await fetch(`/regions/${regionId}/seasons/${seasonName}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch region data');
                }
                const data = await response.json();
                let season = data[regionId]
                season.gameId = region.gameId
                try {
                    const response = await fetch(`/regions/${regionId}/seasons/${season.seasonName}/players`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch players for season ${season.seasonName}`);
                    }
                    let playersData = await response.json();
                    playersData.players = await Promise.all(
                        playersData.players.map(async (player) => {
                            try {
                                const response = await fetch(`/regions/${regionId}/seasons/${season.seasonName}/players/${player._id}`);
                                if (!response.ok) {
                                    throw new Error(`Failed to fetch ${player._id} for season ${season.seasonName}`);
                                }
                                let playerData = await response.json();
                                player = playerData.player
                                for (const game of player.games) {
                                    if (game.gameId === region.gameId) {
                                        for (let tournament of game.tournaments) {
                                            try {
                                                const response = await fetch(`/tournaments/${tournament.tournamentId}`)
                                                if (!response.ok) {
                                                    throw new Error(`Failed to fetch tournament`);
                                                }
                                                const tournamentData = await response.json()
                                                tournament.name = tournamentData.tournament.tournamentName
                                            } catch (error) {
                                                console.error(`Error fetching ${tournament.tournamentId}:`, error);
                                            }
                                        }
                                    }
                                }
                                return player
                            } catch (error) {
                                console.error(`Error fetching ${player._id} for season ${season.seasonName}:`, error);
                                return player
                            }
                        })
                    )
                    season.players = playersData.players
                } catch (error) {
                    console.error(`Error fetching players for season ${season.seasonName}:`, error);
                }
                setSeason(season);
            } catch (error) {
                console.error('Error fetching season data:', error);
            }
        };
        fetchRegionData();
    }, [seasonName]);
    const seasonPropMapper = useCallback(
        (season) => ({
            _id: season.seasonName,
            regionId: regionId,
            season: season,
        }),
        [regionId, seasonName]
    );
    if (!season) {
        return <div>Loading...</div>;
    }
    return (
        <div className="app">
            <Header />
            <main>
                <h1>League Detail for {regionId}</h1>
                <Results items={[{ ...season, _id: season.seasonName }]} Component={SeasonItem} propMapper={seasonPropMapper} />
                <div className="button-grid">
                    <LinkButton to="/search-players">Search Players</LinkButton>
                    <LinkButton to="/search-tournaments">Search Tournaments</LinkButton>
                    <LinkButton to="/h2h-chart">H2H Chart</LinkButton>
                    <LinkButton to="/compare-players">Compare Players</LinkButton>
                </div>
            </main>
        </div>
    );
}

export default SeasonPage;