import React, { useState, useEffect } from 'react';
import {
    BrowserRouter as Router,
    Route,
    useParams,
    Routes
} from 'react-router-dom';
import MatchInfo from './components/matchDetails.jsx';
import './App.css';

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
  const matchDetails = {
    playerChar: "Steve",
    opponentChar: "Diddy Kong",
    stage: "Battlefield",
    type: "loss",
    matchNum: 1
  };

  return (
    <div className="App">
      <MatchInfo matchDetails={matchDetails} />
    </div>
  );
}

export default App;
