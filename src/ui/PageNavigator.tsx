// Page Navigator - Navigate between pages
import React from 'react';
import { store, useStore } from '../document/store';

export const PageNavigator: React.FC = () => {
  const state = useStore();
  const totalPages = state.document.pages.length;
  const currentPage = state.currentPageIndex + 1;

  return (
    <div className="fm-page-navigator">
      <button
        className="nav-btn"
        onClick={() => store.setCurrentPage(0)}
        disabled={currentPage === 1}
        title="First Page"
      >
        ⏮
      </button>
      <button
        className="nav-btn"
        onClick={() => store.setCurrentPage(state.currentPageIndex - 1)}
        disabled={currentPage === 1}
        title="Previous Page"
      >
        ◀
      </button>
      <div className="page-indicator">
        <input
          type="number"
          min={1}
          max={totalPages}
          value={currentPage}
          onChange={(e) => {
            const page = parseInt(e.target.value);
            if (page >= 1 && page <= totalPages) {
              store.setCurrentPage(page - 1);
            }
          }}
          className="page-input"
        />
        <span className="page-total">/ {totalPages}</span>
      </div>
      <button
        className="nav-btn"
        onClick={() => store.setCurrentPage(state.currentPageIndex + 1)}
        disabled={currentPage === totalPages}
        title="Next Page"
      >
        ▶
      </button>
      <button
        className="nav-btn"
        onClick={() => store.setCurrentPage(totalPages - 1)}
        disabled={currentPage === totalPages}
        title="Last Page"
      >
        ⏭
      </button>
      <button
        className="nav-btn add"
        onClick={() => store.addPage()}
        title="Add New Page"
      >
        +
      </button>
    </div>
  );
};
