import React, { useState, useEffect } from 'react';
import {
    BrowserRouter,
    Route,
    useParams,
    Routes
} from 'react-router-dom';
import OpponentList from './components/opponentList.jsx'
import SortList from './components/sortList.jsx';
import SearchList from './components/searchList.jsx';
import TournamentResult from './components/tournamentResult.jsx';

const PlayerDetail = () => {
    let { playerId } = useParams();

    const [playerData, setPlayerData] = useState(null);

    useEffect(() => {
        const fetchPlayerData = async () => {
            try {
                const response = await fetch(`/player/${playerId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch player data');
                }
                const data = await response.json();
                setPlayerData(data.player);
            } catch (error) {
                console.error('Error fetching player data:', error);
            }
        };

        fetchPlayerData();
    }, [playerId]);

    if (!playerData) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Player Information: {playerData.gamerTag}</h1>
            <p>id: {playerData._id}</p>
            <h2>Games:</h2>
            <ul>
              {playerData.games.map((game, index) => (
                  <li key={index}>
                      <p>gameId: {game.gameId}</p>
                  </li>
              ))}
            </ul>
        </div>
    );
};

// const App = () => {
//     return (
//         <Router>
//           <Routes>
//               <Route path="/player/:playerId" element={<PlayerDetail />}></Route>
//             </Routes>
//         </Router>
//     );
// };

function App() {
    const opponentLists = [
        {
          name: 'List 1',
          opponents: [
            {
              opponentName: 'Dog',
              headToHeadScore: '2-1',
              sets: [
                { type: 'win', matches: [{ playerChar: 'Steve', opponentChar: 'Diddy Kong', stage: 'N/A', type: 'loss', matchNum: 1 }] },
                { type: 'loss', matches: [{ playerChar: 'Steve', opponentChar: 'Diddy Kong', stage: 'N/A', type: 'win', matchNum: 2 }] },
              ],
            },
            {
                opponentName: 'Cat',
                headToHeadScore: '1-2',
                sets: [
                  { type: 'win', matches: [{ playerChar: 'Steve', opponentChar: 'Mario', stage: 'N/A', type: 'win', matchNum: 1 }] },
                  { type: 'win', matches: [{ playerChar: 'Steve', opponentChar: 'Mario', stage: 'N/A', type: 'loss', matchNum: 2 }] },
                ],
              },
            // Add more opponents as needed
          ],
        },
        {
          name: 'List 2',
          opponents: [
            {
              opponentName: 'Opponent B',
              headToHeadScore: '1-2',
              sets: [
                { type: 'win', matches: [{ playerChar: 'Steve', opponentChar: 'Mario', stage: 'N/A', type: 'win', matchNum: 1 }] },
                { type: 'win', matches: [{ playerChar: 'Steve', opponentChar: 'Mario', stage: 'N/A', type: 'loss', matchNum: 2 }] },
              ],
            },
            // Add more opponents as needed
          ],
        },
        // Add more lists as needed
      ];
    const goml = {
        id: "1216463",
        gamerTag: "Syrup",
        placement: 5,
        matches: [
        {
        opponentId: 258371,
        opponentName: "Sonix",
        tournaments: [
        {
        setId: 74914052,
        tournamentId: 570293,
        eventId: 948374,
        type: "loss",
        matches: [ ]
        }
        ]
        },
        {
        opponentId: 15768,
        opponentName: "Tweek",
        tournaments: [
            {
            setId: 74914038,
            tournamentId: 570293,
            eventId: 948374,
            type: "loss",
            matches: [
            {
            playerChar: "Steve",
            opponentChar: "Diddy Kong",
            stage: "N/A",
            type: "loss",
            matchNum: 1
            },
            {
            playerChar: "Steve",
            opponentChar: "Diddy Kong",
            stage: "N/A",
            type: "win",
            matchNum: 2
            },
            {
            playerChar: "Steve",
            opponentChar: "Diddy Kong",
            stage: "N/A",
            type: "win",
            matchNum: 3
            },
            {
            playerChar: "Steve",
            opponentChar: "Diddy Kong",
            stage: "N/A",
            type: "loss",
            matchNum: 4
            },
            {
            playerChar: "Steve",
            opponentChar: "Diddy Kong",
            stage: "N/A",
            type: "loss",
            matchNum: 5
            }
            ]
            }
            ]
        },
        {
        opponentId: 4702,
        opponentName: "Dabuz",
        tournaments: [
        {
        setId: 74892966,
        tournamentId: 570293,
        eventId: 948374,
        type: "win",
        matches: [ ]
        }
        ]
        },
        {
        opponentId: 823045,
        opponentName: "SHADIC",
        tournaments: [
        {
        setId: 74892960,
        tournamentId: 570293,
        eventId: 948374,
        type: "win",
        matches: [ ]
        }
        ]
        },
        {
        opponentId: 33730,
        opponentName: "Seesaw",
        tournaments: [
        {
        setId: 74857625,
        tournamentId: 570293,
        eventId: 948374,
        type: "win",
        matches: [ ]
        }
        ]
        },
        {
        opponentId: 1409030,
        opponentName: "M.C. Cant Read",
        tournaments: [
        {
        setId: 74831469,
        tournamentId: 570293,
        eventId: 948374,
        type: "win",
        matches: [ ]
        }
        ]
        },
        {
        opponentId: 1003263,
        opponentName: "Sailor Jess",
        tournaments: [
        {
        setId: 74831465,
        tournamentId: 570293,
        eventId: 948374,
        type: "win",
        matches: [ ]
        }
        ]
        },
        {
        opponentId: 2374471,
        opponentName: "Taima",
        tournaments: [
        {
        setId: 74831457,
        tournamentId: 570293,
        eventId: 948374,
        type: "win",
        matches: [ ]
        }
        ]
        }
        ]
        }
    const tournament = 'Get On My Level X - Canadian Fighting Game Championships'
    const event = 'Super Smash Bros. Ultimate - Singles'
    const entrantCount = 688
  return (
    <div className="App">
      <TournamentResult list={goml} tournament={tournament} event={event} entrantCount={entrantCount}/>
    </div>
  );
}

export default App;
