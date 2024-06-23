import React from 'react';
import logo from '../assets/NJ_SSBM.jpeg';

const Header = () => {
  return (
    <header className="header">
      <img src={logo} alt="Logo" className="logo" />
      <h1>PR Tracker</h1>
      <nav>
        <a href="/regions">Regions</a>
        <a href="/profile">Profile</a>
      </nav>
    </header>
  );
};

export default Header;
