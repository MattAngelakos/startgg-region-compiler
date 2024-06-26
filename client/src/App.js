// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import LeaguePage from './components/LeaguePage';
// import LeagueDetail from './components/LeagueDetail';
// import SeasonPage from './components/SeasonPage';
// import PlayerSearchSeason from './components/PlayerSearchSeason';

// const App = () => {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/regions" element={<LeaguePage />} />
//         <Route path="/regions/:regionId" element={<LeagueDetail />} />
//         <Route path="/regions/:regionId/seasons/:seasonName" element={<SeasonPage />} />
//         <Route path="/regions/:regionId/seasons/:seasonName/players" element={<PlayerSearchSeason/>} />
//       </Routes>
//     </Router>
//   );
// };

import React from 'react';
import HeadToHeadChart from './components/HeadToHeadChart.jsx';

const data = {
  Syrup: {
    id: 1216463,
    Tweek: { wins: 0, losses: 1 },
    Marvale: { wins: 6, losses: 0 }
  },
  Tweek: {
    id: 15768,
    Marvale: { wins: 0, losses: 0 },
    Syrup: { wins: 1, losses: 0 }
  },
  Marvale: {
    id: 1189720,
    Syrup: { wins: 0, losses: 6 },
    Tweek: { wins: 0, losses: 0 }
  }
};

function App() {
  return (
    <div className="App">
      <HeadToHeadChart data={data} />
    </div>
  );
}

export default App;

