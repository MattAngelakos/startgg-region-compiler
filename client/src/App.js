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
      
  return (
    <div className="App">
      <SearchList list={opponentLists[0]} ListComponent={OpponentList} searchField={'opponentName'}/>
    </div>
  );
}

export default App;
