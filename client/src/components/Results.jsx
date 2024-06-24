import React from 'react';

const Results = ({ items, Component, propMapper }) => {
  return (
    <div className="results">
      {items.map((item) => (
        <Component key={item.id} {...propMapper(item)} />
      ))}
    </div>
  );
};

export default Results;
