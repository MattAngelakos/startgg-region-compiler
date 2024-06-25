// import React, { useState, useEffect } from 'react';
// import {
//     BrowserRouter,
//     Route,
//     useParams,
//     Routes
// } from 'react-router-dom';
// import OpponentList from './components/opponentList.jsx'
// import SortList from './components/sortList.jsx';
// import SearchList from './components/searchList.jsx';
// import TournamentResult from './components/tournamentResult.jsx';

// const PlayerDetail = () => {
//     let { playerId } = useParams();

//     const [playerData, setPlayerData] = useState(null);

//     useEffect(() => {
//         const fetchPlayerData = async () => {
//             try {
//                 const response = await fetch(`/player/${playerId}`);
//                 if (!response.ok) {
//                     throw new Error('Failed to fetch player data');
//                 }
//                 const data = await response.json();
//                 setPlayerData(data.player);
//             } catch (error) {
//                 console.error('Error fetching player data:', error);
//             }
//         };

//         fetchPlayerData();
//     }, [playerId]);

//     if (!playerData) {
//         return <div>Loading...</div>;
//     }

//     return (
//         <div>
//             <h1>Player Information: {playerData.gamerTag}</h1>
//             <p>id: {playerData._id}</p>
//             <h2>Games:</h2>
//             <ul>
//               {playerData.games.map((game, index) => (
//                   <li key={index}>
//                       <p>gameId: {game.gameId}</p>
//                   </li>
//               ))}
//             </ul>
//         </div>
//     );
// };

// const App = () => {
//     return (
//         <Router>
//           <Routes>
//               <Route path="/player/:playerId" element={<PlayerDetail />}></Route>
//             </Routes>
//         </Router>
//     );
// };

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LeaguePage from './components/LeaguePage';
import LeagueDetail from './components/LeagueDetail';
import SeasonPage from './components/SeasonPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/regions" element={<LeaguePage />} />
        <Route path="/regions/:regionId" element={<LeagueDetail />} />
        <Route path="/regions/:regionId/seasons/:seasonName" element={<SeasonPage />} />
      </Routes>
    </Router>
  );
};

export default App;
