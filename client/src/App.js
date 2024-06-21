import React, { useState, useEffect } from 'react';
import {
    BrowserRouter as Router,
    Route,
    useParams,
    Routes
} from 'react-router-dom';
import Set from './components/set.jsx';
import './App.css';
import SetList from './components/setList.jsx';
import OpponentList from './components/opponentList.jsx';

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
    const opponents = [
      {
        opponentName: 'Diddy Kong',
        headToHeadScore: '2-1',
        sets: [
          {
            type: 'loss',
            matches: [
              {
                playerChar: 'Steve',
                opponentChar: 'Diddy Kong',
                stage: 'N/A',
                type: 'loss',
                matchNum: 1,
              },
              {
                playerChar: 'Mario',
                opponentChar: 'Luigi',
                stage: 'Final Destination',
                type: 'win',
                matchNum: 2,
              },
            ],
          },
          {
            type: 'win',
            matches: [
              {
                playerChar: 'Link',
                opponentChar: 'Zelda',
                stage: 'Battlefield',
                type: 'win',
                matchNum: 1,
              },
              {
                playerChar: 'Samus',
                opponentChar: 'Ridley',
                stage: 'N/A',
                type: 'win',
                matchNum: 2,
              },
            ],
          },
        ],
      },
      {
        opponentName: 'Luigi',
        headToHeadScore: '3-2',
        sets: [
          {
            type: 'win',
            matches: [
              {
                playerChar: 'Peach',
                opponentChar: 'Luigi',
                stage: 'Final Destination',
                type: 'win',
                matchNum: 1,
              },
              {
                playerChar: 'Bowser',
                opponentChar: 'Luigi',
                stage: 'Battlefield',
                type: 'loss',
                matchNum: 2,
              },
            ],
          },
          {
            type: 'loss',
            matches: [
              {
                playerChar: 'Yoshi',
                opponentChar: 'Luigi',
                stage: 'N/A',
                type: 'loss',
                matchNum: 1,
              },
              {
                playerChar: 'Donkey Kong',
                opponentChar: 'Luigi',
                stage: 'Final Destination',
                type: 'win',
                matchNum: 2,
              },
            ],
          },
        ],
      },
      // Add more opponent objects as needed
    ];
      

  return (
    <div className="App">
      <OpponentList opponents={opponents} />
    </div>
  );
}

export default App;
