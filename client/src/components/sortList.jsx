import React, { useState } from 'react';

const SortList = ({ lists, ListComponent }) => {
  const [selectedListIndex, setSelectedListIndex] = useState(0);

  const handleChange = (event) => {
    setSelectedListIndex(event.target.value);
  };
  return (
    <div>
      <select onChange={handleChange}>
        {lists.map((list, index) => (
          <option key={index} value={index}>
            {list.name}
          </option>
        ))}
      </select>
      <ListComponent {...lists[selectedListIndex]} />
    </div>
  );
};

export default SortList;
