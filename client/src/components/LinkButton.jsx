import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const LinkButton = ({ to, children }) => {
  const location = useLocation();
  const newPath = `${location.pathname}${to}`;

  return (
    <Link to={newPath} className="link-button">
      <button className="button">
        {children}
      </button>
    </Link>
  );
};

export default LinkButton;
