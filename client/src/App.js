import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';

function ProfilePage() {
  let { playerId } = useParams();
  return (
    <div>
      Profile Page for player with ID: {playerId}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/player/*">
          <Route path=":playerId" element={<ProfilePage />} />
          <Route path="stats" element={<div>Player Stats</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
