import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import Results from './Results';
import SeasonItem from './SeasonItem';
import LinkButton from './LinkButton';

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
            <div className="RegionidSeasonidSeasonPage w-full h-full absolute bg-slate-200">
                <div className="BackgroundEffects w-96 h-96 left-[-85px] top-[109px] absolute">
                    <div className="Ellipse1 w-96 h-96 left-[1308px] top-[342px] fixed bg-purple-200 rounded-full blur-3xl" />
                    <div className="Ellipse2 w-96 h-96 left-0 top-0 fixed bg-purple-200 rounded-full blur-3xl" />
                </div>
                <Header link={`/regions/${regionId}`}linkname={regions.regionName}/>
                <main>
                {/* <div className="SeasonInfo w-96 h-24 left-[120px] top-[226px] absolute">
                    <div className="PlayerCount w-32 h-16 left-[1072px] top-[17px] absolute justify-start items-center gap-0.5 inline-flex">
                        <img className="SeasonPlayerImage w-16 h-16" src="https://via.placeholder.com/63x63" />
                        <div className="SeasonNumplayers text-black text-3xl font-medium font-['Inter'] leading-10">420</div>
                    </div>
                        <div className="TournamentCount w-28 h-12 left-[869px] top-[25px] absolute justify-center items-center gap-3 inline-flex">
                        <img className="League1TournamentImage w-16 h-16" src="https://via.placeholder.com/63x63" />
                        <div className="League1Numtournaments text-black text-3xl font-medium font-['Inter'] leading-10">72</div>
                    </div>
                        <div className="LeagueDates w-96 h-12 left-[423px] top-[25px] absolute justify-start items-start gap-3 inline-flex">
                        <img className="SeasonDateImage w-10 h-12" src="https://via.placeholder.com/42x47" />
                        <div className="SeasonDate text-black text-3xl font-medium font-['Inter'] leading-10">04/01/24 - 06/30/24</div>
                    </div>
                        <div className="SeasonName w-80 h-24 left-0 top-0 absolute justify-start items-center gap-6 inline-flex">
                        <img className="SeasonPfp w-24 h-24 rounded-full border-2 border-black" src="https://via.placeholder.com/98x98" />
                        <div className="SeasonName text-black text-5xl font-medium font-['Inter'] leading-10">Q2 2024</div>
                    </div>
                </div> */}
                    <h1 className="text-3xl font-bold underline pt-10 block absolute" >League Detail for {regionId}</h1>

                    <div className="SeasonInfo w-96 h-24 left-[120px] top-[226px] absolute">
                        <Results items={[{ ...season, _id: season.seasonName }]} Component={SeasonItem} propMapper={seasonPropMapper} />
                        
                    </div>

                    <div className="Buttons w-80 h-64 left-[247px] top-[387px] absolute">
                        <div className="ComparePlayers w-80 h-24 px-14 py-9 left-[562px] top-[163px] absolute bg-zinc-300 rounded-full shadow justify-center items-center gap-2.5 inline-flex">
                            <div className="ComparePlayers text-center text-black text-3xl font-medium font-['Inter'] leading-10"><LinkButton to="/compare-players">Compare Players</LinkButton></div>
                        </div>
                        <div className="H2hChart w-80 h-24 px-14 py-9 left-0 top-[163px] absolute bg-zinc-300 rounded-full shadow justify-center items-center gap-2.5 inline-flex">
                            <div className="H2hChart text-center text-black text-3xl font-medium font-['Inter'] leading-10"><LinkButton to="/h2h-chart">H2H Chart</LinkButton></div>
                        </div>
                        <div className="SearchTournaments w-80 h-24 px-14 py-9 left-[562px] top-0 absolute bg-zinc-300 rounded-full shadow justify-center items-center gap-2.5 inline-flex">
                            <div className="SearchTournaments text-center text-black text-3xl font-medium font-['Inter'] leading-10"><LinkButton to="/tournaments">Search Tournaments</LinkButton></div>
                        </div>
                        <div className="SearchPlayers w-80 h-24 px-14 py-9 left-0 top-0 absolute bg-zinc-300 rounded-full shadow justify-center items-center gap-2.5 inline-flex">
                            <div className="SearchPlayers text-center text-black text-3xl font-medium font-['Inter'] leading-10"><LinkButton to="/players">Search Players</LinkButton></div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default SeasonPage;