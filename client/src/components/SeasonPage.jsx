import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import Results from './Results';
import SeasonItem from './SeasonItem';
import LinkButton from './LinkButton';
import Background from "./Background";
import SeasonInfo from "./SeasonInfo";

const SeasonPage = () => {
    const { regionId, seasonName } = useParams();
    const [season, setSeason] = useState(null);
    const [regions, setRegion] = useState(null)
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
                setRegion(region)
                setSeason(season);
            } catch (error) {
                console.error('Error fetching season data:', error);
            }
        };
        fetchRegionData();
    }, [seasonName, regionId]);
    const seasonPropMapper = useCallback(
        (season) => ({
            _id: season.seasonName,
            regionId: regionId,
            season: season,
        }),
        [regionId]
    );
    if (!season || !regions) {
        return <div>Loading...</div>;
    }
    return (
        <div className="app">
                <Background/>
                <Header link={`/regions/${regionId}`}linkname={regions.regionName}/>
                <main>
                <SeasonInfo/>


                    {/* <div className="SeasonInfo w-96 h-24 left-[120px] top-[226px] absolute">
                        <Results items={[{ ...season, _id: season.seasonName }]} Component={SeasonItem} propMapper={seasonPropMapper} />
                        
                    </div> */}

                    <div className="Buttons w-80 h-64 left-[247px] top-[387px] absolute">
                        <LinkButton to="/compare-players">
                        <div className="ComparePlayers w-80 h-24 px-14 py-9 left-[562px] top-[163px] absolute bg-zinc-300 rounded-full shadow justify-center items-center gap-2.5 inline-flex">
                            <div className="ComparePlayers text-center text-black text-3xl font-medium font-['Inter'] leading-10">Compare Players</div>
                        </div>
                        </LinkButton>
                        <LinkButton to="/h2h-chart">
                        <div className="H2hChart w-80 h-24 px-14 py-9 left-0 top-[163px] absolute bg-zinc-300 rounded-full shadow justify-center items-center gap-2.5 inline-flex">
                            <div className="H2hChart text-center text-black text-3xl font-medium font-['Inter'] leading-10">H2H Chart</div>
                        </div>
                        </LinkButton>
                        <LinkButton to="/tournaments">
                        <div className="SearchTournaments w-80 h-24 px-14 py-9 left-[562px] top-0 absolute bg-zinc-300 rounded-full shadow justify-center items-center gap-2.5 inline-flex">
                            <div className="SearchTournaments text-center text-black text-3xl font-medium font-['Inter'] leading-10">Search Tournaments</div>
                        </div>
                        </LinkButton>
                        <LinkButton to="/players">
                        <div className="SearchPlayers w-80 h-24 px-14 py-9 left-0 top-0 absolute bg-zinc-300 rounded-full shadow justify-center items-center gap-2.5 inline-flex">
                            <div className="SearchPlayers text-center text-black text-3xl font-medium font-['Inter'] leading-10">Search Players</div>
                        </div>
                        </LinkButton>
                    </div>
                </main>
            </div>
    );
}

export default SeasonPage;