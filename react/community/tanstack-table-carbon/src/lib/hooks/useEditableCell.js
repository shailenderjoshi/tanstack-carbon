import { useState, useRef, useEffect } from 'react';
import { useKeyPress } from './useKeyPress';

/**
 * useEditableCell Hook
 * Manages editable cell state and keyboard navigation
 * Based on TanStack's editable cells example
 *
 * @param {Object} tableContainerRef - Ref to the table container
 * @returns {Object} - Editable cell state and handlers
 */
export const useEditableCell = (tableContainerRef) => {
  const [editingId, setEditingId] = useState(null);
  const commandLeft = useKeyPress(['Meta+ArrowLeft']);
  const captureCommandLeft = useRef(false);

  useEffect(() => {
    captureCommandLeft.current = commandLeft;
  }, [commandLeft]);

  // NOTE: Roving tabIndex entry point — keeps exactly one td with tabIndex=0
  // so Tab from outside the table (e.g. from a checkbox column) can land on
  // the first data cell and enter the grid. Only active when editable cells
  // are present (this hook is only used then).
  const ensureTabEntry = () => {
    if (editingId) {
      return;
    }
    const already =
      tableContainerRef.current?.querySelector('td[tabindex="0"]');
    if (already) {
      return;
    }
    const firstCell = tableContainerRef.current?.querySelector(
      'tbody tr:first-child td'
    );
    if (firstCell) {
      firstCell.tabIndex = 0;
    }
  };

  useEffect(() => {
    ensureTabEntry();
  });

  const removeActiveCell = () => {
    if (editingId) {
      return;
    }
    const allTableCells = tableContainerRef.current?.querySelectorAll('td');
    allTableCells?.forEach((cell) => {
      cell.tabIndex = -1;
    });
    document.activeElement?.blur();
    // NOTE: Restore the tab entry point after clearing so Tab can re-enter the grid
    ensureTabEntry();
  };

  const getActiveCell = () => {
    const activeCellElement =
      tableContainerRef.current?.querySelector('td[tabindex="0"]');
    return activeCellElement;
  };

  const addActiveCell = (target) => {
    if (editingId) {
      return;
    }
    const activeCell = target.closest('td');
    if (activeCell) {
      // NOTE: Roving tabIndex — move the single tabIndex=0 to the newly active cell
      tableContainerRef.current?.querySelectorAll('td').forEach((cell) => {
        cell.tabIndex = -1;
      });
      activeCell.tabIndex = 0;
      activeCell.focus();
    }
  };

  const handleFocusChange = (event) => {
    if (tableContainerRef?.current) {
      const tableBody = tableContainerRef?.current.querySelector('tbody');
      if (!tableBody?.contains(event.target)) {
        return;
      }
    }
    removeActiveCell();
    addActiveCell(event.target);
  };

  const getChildElementIndex = (node) => {
    return Array.prototype.indexOf.call(node.parentNode.children, node);
  };

  const handleKeyDownActiveCell = (event) => {
    const key = event.code;
    const activeCellElement = getActiveCell();

    if (commandLeft) {
      return;
    }

    if (!activeCellElement) {
      return;
    }

    // NOTE: If an overflow menu within this table is open, let Carbon handle arrow key navigation.
    // Carbon renders the menu list via a portal into data-floating-menu-container, which is an
    // ancestor of tableContainerRef — .closest() walks up to find it, then queries down.
    const floatingMenuContainer =
      tableContainerRef.current?.closest('[data-floating-menu-container]') ??
      tableContainerRef.current;
    if (
      floatingMenuContainer?.querySelector(
        'ul.cds--overflow-menu-options--open'
      )
    ) {
      return;
    }

    switch (key) {
      case 'ArrowLeft': {
        // NOTE: Prevent scrolling
        event.preventDefault();
        if (activeCellElement.previousElementSibling) {
          removeActiveCell();
          addActiveCell(activeCellElement.previousElementSibling);
        }
        return;
      }
      case 'ArrowRight': {
        // NOTE: Prevent scrolling
        event.preventDefault();
        if (activeCellElement.nextElementSibling) {
          removeActiveCell();
          addActiveCell(activeCellElement.nextElementSibling);
        }
        return;
      }
      case 'ArrowUp': {
        // NOTE: Prevent scrolling
        event.preventDefault();
        const parentRow = activeCellElement.closest('tr');
        const activeCellRowIndex = getChildElementIndex(activeCellElement);
        if (parentRow.previousElementSibling) {
          const newParentRow = parentRow.previousElementSibling;
          const newRowCells = newParentRow.children;
          removeActiveCell();
          addActiveCell(newRowCells[activeCellRowIndex]);
        }
        return;
      }
      case 'ArrowDown': {
        // NOTE: Prevent scrolling
        event.preventDefault();
        const parentRow = activeCellElement.closest('tr');
        const activeCellRowIndex = getChildElementIndex(activeCellElement);
        if (parentRow.nextElementSibling) {
          const newParentRow = parentRow.nextElementSibling;
          const newRowCells = newParentRow.children;
          removeActiveCell();
          addActiveCell(newRowCells[activeCellRowIndex]);
        }
        return;
      }
      case 'Tab': {
        // NOTE: If the next sibling td contains an overflow menu button, focus it directly
        const nextSibling = activeCellElement.nextElementSibling;
        const overflowBtn = nextSibling?.querySelector(
          'button.cds--overflow-menu'
        );
        if (overflowBtn) {
          event.preventDefault();
          removeActiveCell();
          overflowBtn.focus();
          return;
        }
        // NOTE: Exit grid, ensureTabEntry restores the tab entry point for next time
        removeActiveCell();
        return;
      }
      case 'Enter': {
        return;
      }
    }
  };

  return {
    editingId,
    setEditingId,
    commandLeft,
    handleFocusChange,
    handleKeyDownActiveCell,
  };
};
