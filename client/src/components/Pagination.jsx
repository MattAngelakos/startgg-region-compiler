import React from 'react';

const Pagination = ({ currentPage, totalItems, perPage, onChangePage, onChangePerPage }) => {
  const totalPages = Math.ceil(totalItems / perPage);
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onChangePage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onChangePage(currentPage + 1);
    }
  };
  return (
    <div className="pagination">
      <button onClick={handlePreviousPage} disabled={currentPage === 1}>
        Previous
      </button>
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={handleNextPage} disabled={currentPage === totalPages}>
        Next
      </button>
      <label>
        Per Page:
        <select value={perPage} onChange={(e) => onChangePerPage(Number(e.target.value))}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>25</option>
          <option value={15}>50</option>
        </select>
      </label>
    </div>
  );
};

export default Pagination;
