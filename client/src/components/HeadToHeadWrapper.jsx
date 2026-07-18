import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import TournamentFilter from './TournamentFilter';
import PlayerFilter from './PlayerFilter';
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";


const HeadToHeadWrapper = () => {
    const { regionId, seasonName } = useParams();
    const [head2head, setHead2Head] = useState(null);
    const [originalH2H, setOriginalHead2Head] = useState(null);
    const [tournaments, setTournaments] = useState([]);
    const [sortKey, setSortKey] = useState("rating");

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


    const downloadExcel = async () => {
        const players = Object.keys(head2head);

        // Sort players by Elo or Glicko
        const sortedPlayers = players.sort((a, b) => (head2head[b]?.[sortKey] || 0) - (head2head[a]?.[sortKey] || 0));

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("H2H Chart");

        // Define color styles
        const styles = {
            darkGreen: { type: "pattern", pattern: "solid", fgColor: { argb: "38761D" }, font: { color: { argb: "FFFFFF" } } }, // Dark Green
            lightGreen: { type: "pattern", pattern: "solid", fgColor: { argb: "C6E0B4" } }, // Light Green
            darkRed: { type: "pattern", pattern: "solid", fgColor: { argb: "990000" }, font: { color: { argb: "FFFFFF" } } }, // Dark Red
            lightRed: { type: "pattern", pattern: "solid", fgColor: { argb: "F4CCCC" } }, // Light Red
            yellow: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2CC" } }, // Yellow
            black: { type: "pattern", pattern: "solid", fgColor: { argb: "000000" }, font: { color: { argb: "FFFFFF" } } }, // Black
            gray: { type: "pattern", pattern: "solid", fgColor: { argb: "D9D9D9" } }, // Gray
        };

        // Set the header row
        worksheet.addRow(["", ...sortedPlayers]);

        sortedPlayers.forEach((player, rowIndex) => {
            let row = worksheet.addRow([player]);

            sortedPlayers.forEach((opponent, colIndex) => {
                let cell;
                if (player === opponent) {
                    cell = row.getCell(colIndex + 2);
                    cell.value = "X";
                    cell.fill = styles.gray;
                } else {
                    const matchup = head2head[player]?.[opponent];
                    const winLoss = matchup ? `${matchup.wins}-${matchup.losses}` : "0-0";
                    cell = row.getCell(colIndex + 2);
                    cell.value = winLoss;

                    // Apply color formatting based on win/loss conditions
                    if (!matchup || cell.value === 'X') {
                        cell.fill = styles.black; // No matchup (black)
                    } else if (matchup.wins > matchup.losses) {
                        if (matchup.losses === 0) {
                            cell.fill = styles.darkGreen; // More wins, no losses (dark green)
                        } else {
                            cell.fill = styles.lightGreen; // More wins, but has losses (light green)
                        }
                    } else if (matchup.wins < matchup.losses) {
                        if (matchup.wins === 0) {
                            cell.fill = styles.darkRed; // More losses, no wins (dark red)
                        } else {
                            cell.fill = styles.lightRed; // More losses, but has wins (light red)
                        }
                    } else if ((matchup.wins === matchup.losses) && matchup.wins !== 0){
                        cell.fill = styles.yellow; // Equal wins and losses (yellow)
                    }
                    else if ((matchup.wins === matchup.losses) && matchup.wins === 0){
                        cell.fill = styles.gray; // Equal wins and losses (yellow)
                    }
                }
            });
        });

        // Auto-size columns
        worksheet.columns.forEach((column) => {
            column.width = 12;
        });

        // Write and download the file
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), "h2h_chart_sorted.xlsx");
    };

    if (!head2head || tournaments.length === 0) {
        return <div>Loading...</div>;
    }

    return (
        <div className="app">
            <Header link={`/regions/${regionId}/seasons/${seasonName}`} linkname={seasonName} />
            <main>
                <button
                    onClick={downloadExcel}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                >
                    Download Excel
                </button>
                <h1>League Head2Head Detail for {regionId}</h1>
                <TournamentFilter
                    tournaments={tournaments}
                    filterh2h={filterh2h}
                />
                <PlayerFilter originalObject={head2head} originalH2H={originalH2H} />
            </main>
        </div>
    );
};

export default HeadToHeadWrapper;
