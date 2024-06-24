import React from 'react';
import * as Select from '@radix-ui/react-select';

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
        <Select.Root value={String(perPage)} onValueChange={(value) => onChangePerPage(Number(value))}>
          <Select.Trigger className="select-trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.ScrollUpButton />
            <Select.Viewport>
              <Select.Item value="5">
                <Select.ItemText>5</Select.ItemText>
              </Select.Item>
              <Select.Item value="10">
                <Select.ItemText>10</Select.ItemText>
              </Select.Item>
              <Select.Item value="15">
                <Select.ItemText>15</Select.ItemText>
              </Select.Item>
              <Select.Item value="25">
                <Select.ItemText>25</Select.ItemText>
              </Select.Item>
              <Select.Item value="50">
                <Select.ItemText>50</Select.ItemText>
              </Select.Item>
            </Select.Viewport>
            <Select.ScrollDownButton />
          </Select.Content>
        </Select.Root>
      </label>
    </div>
  );
};

export default Pagination;
