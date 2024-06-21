import React, { useState } from 'react';

const Collapsible = ({ title, children }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="collapsible">
      <div onClick={toggleCollapse} className="collapsible-header">
        {title}
      </div>
      {!isCollapsed && (
        <div className="collapsible-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default Collapsible;