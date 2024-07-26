import React from 'react';
import logo from '../assets/NJ_SSBM.jpeg';

const Header = ({ link, linkname }) => {
  return (
    <header className="relative">
      <img src={logo} alt="Logo" className="Logo w-28 h-28 inline" />
      <div className="PrTracker pl-5 pt-4 inline text-black text-5xl font-medium font-['Inter'] leading-10">PR Tracker</div>
      <nav> 
      <div className="Regions w-40 left-[1069px] top-[36px] absolute text-center text-black text-3xl font-medium font-['Inter'] leading-10">
        <a href="/regions">Regions</a>
      </div>
      <div className="Profile w-40 left-[1252px] top-[36px] absolute text-center text-black text-3xl font-medium font-['Inter'] leading-10">
        <a href="/profile">Profile</a>
      </div>
        <div className="LeagueName text-center text-black text-6xl pt-8 font-medium font-['Inter'] leading-10">
          <a href={link}>{linkname}</a>
        </div>
      </nav>
      <div className="Line1 w-full h-1 border-2 absolute top-28 border-black"></div>
    </header>
  );
};

export default Header;
