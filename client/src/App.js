import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LeaguePage from './components/LeaguePage';
import LeagueDetail from './components/LeagueDetail';
import SeasonPage from './components/SeasonPage';
import PlayerSearchSeason from './components/PlayerSearchSeason';
import HeadToHeadWrapper from './components/HeadToHeadWrapper';
import TournamentSearchSeason from './components/TournamentSearchSeason';
import PlayerPage from './components/PlayerPage';
import PlayerGamePage from './components/PlayerGamePage';
import SeasonPlayerPage from './components/SeasonPlayerPage';
import BracketPage from './components/BracketPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/regions" replace />} />
        <Route path="/regions" element={<LeaguePage />} />
        <Route path="/regions/:regionId" element={<LeagueDetail />} />
        <Route path="/regions/:regionId/seasons/:seasonName" element={<SeasonPage />} />
        <Route path="/regions/:regionId/seasons/:seasonName/players" element={<PlayerSearchSeason />} />
        <Route path="/regions/:regionId/seasons/:seasonName/players/:playerId" element={<SeasonPlayerPage />} />
        <Route path="/regions/:regionId/seasons/:seasonName/tournaments" element={<TournamentSearchSeason />} />
        <Route path="/regions/:regionId/seasons/:seasonName/tournaments/:tournamentId/events/:eventId" element={<BracketPage />} />
        <Route path="/regions/:regionId/seasons/:seasonName/h2h-chart" element={<HeadToHeadWrapper />} />
        <Route path="/players/:playerId" element={<PlayerPage />} />
        <Route path="/players/:playerId/games/:gameId" element={<PlayerGamePage />} />
        <Route path="*" element={<Navigate to="/regions" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
