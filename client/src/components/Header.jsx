import React from 'react';
import logo from '../assets/NJ_SSBM.jpeg';

const Header = ({ link, linkname }) => {
  return (
    <header className="header">
      <img src={logo} alt="Logo" className="logo" />
      <h1>PR Tracker</h1>
      <nav> 
        <a href="/regions">Regions</a>
        <a href="/profile">Profile</a>
        <a href={link}>{linkname}</a>
      </nav>
    </header>
  );
};

export default Header;
