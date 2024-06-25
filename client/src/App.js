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
import PlayerSearchSeason from './components/PlayerSearchSeason';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/regions" element={<LeaguePage />} />
        <Route path="/regions/:regionId" element={<LeagueDetail />} />
        <Route path="/regions/:regionId/seasons/:seasonName" element={<SeasonPage />} />
        <Route path="/regions/:regionId/seasons/:seasonName/players" element={<PlayerSearchSeason/>} />
      </Routes>
    </Router>
  );
};

export default App;

// import React, { useState } from 'react';
// import { BrowserRouter as Router, Route, Routes, useNavigate, useParams } from 'react-router-dom';

// // Example player data
// const players = [
//   { id: 1, name: 'Lionel Messi' },
//   { id: 2, name: 'Cristiano Ronaldo' },
//   { id: 3, name: 'Neymar Jr' },
//   { id: 4, name: 'Kylian Mbappe' },
//   // Add more players as needed
// ];

// // Component for the player search bar
// const PlayerSearch = () => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [dropdownVisible, setDropdownVisible] = useState(false);
//   const navigate = useNavigate();

//   const handleInputChange = (event) => {
//     setSearchQuery(event.target.value);
//     setDropdownVisible(true);
//   };

//   const handlePlayerClick = (playerId) => {
//     setDropdownVisible(false);
//     navigate(`/players/${playerId}`);
//   };

//   const filteredPlayers = players.filter(player =>
//     player.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//     <div>
//       <input
//         type="text"
//         placeholder="Search for a player"
//         value={searchQuery}
//         onChange={handleInputChange}
//         onBlur={() => setTimeout(() => setDropdownVisible(false), 200)} // Close dropdown on blur with a slight delay
//         onFocus={() => setDropdownVisible(true)} // Open dropdown on focus
//       />
//       {dropdownVisible && filteredPlayers.length > 0 && (
//         <ul style={{ border: '1px solid #ccc', marginTop: '0', position: 'absolute', zIndex: '1', backgroundColor: 'white', listStyleType: 'none', paddingLeft: '0', width: '200px' }}>
//           {filteredPlayers.map(player => (
//             <li
//               key={player.id}
//               onMouseDown={() => handlePlayerClick(player.id)} // Use onMouseDown instead of onClick to handle the event before onBlur
//               style={{ padding: '8px', cursor: 'pointer' }}
//             >
//               {player.name}
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// };

// // Component for displaying individual player details
// const PlayerDetail = () => {
//   const { id } = useParams();
//   const player = players.find(p => p.id === parseInt(id));

//   return (
//     <div>
//       {player ? (
//         <div>
//           <h2>{player.name}</h2>
//           <p>Details about {player.name}...</p>
//         </div>
//       ) : (
//         <p>Player not found</p>
//       )}
//     </div>
//   );
// };

// // Main app component with routing setup
// const App = () => {
//   return (
//     <Router>
//       <div>
//         <h1>Player Search</h1>
//         <PlayerSearch />
//         <Routes>
//           <Route path="/players/:id" element={<PlayerDetail />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// };

// export default App;
