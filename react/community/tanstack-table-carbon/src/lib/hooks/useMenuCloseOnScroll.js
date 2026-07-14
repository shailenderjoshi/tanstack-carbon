import { useEffect } from 'react';

/**
 * Custom hook to close overflow menu when scrolling occurs.
 * Uses a MutationObserver to wait for .cds--data-table-content to appear
 * (it may not exist at mount time when the table is in a loading state).
 */
const useMenuCloseOnScroll = (tableRef) => {
  useEffect(() => {
    let scrollTarget = null;

    const handleScroll = () => {
      const openMenu = document.querySelector(
        'button.cds--overflow-menu--open'
      );
      if (openMenu) {
        openMenu.click();
      }
    };

    const attach = () => {
      const el = tableRef.current?.querySelector('.cds--data-table-content');
      if (el && el !== scrollTarget) {
        if (scrollTarget) {
          scrollTarget.removeEventListener('scroll', handleScroll);
        }
        scrollTarget = el;
        scrollTarget.addEventListener('scroll', handleScroll);
      }
    };

    // Try immediately in case the table is already rendered
    attach();

    // Watch for .cds--data-table-content being added to the DOM
    // (e.g. after loading state resolves)
    const observer = new MutationObserver(attach);
    if (tableRef.current) {
      observer.observe(tableRef.current, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
      if (scrollTarget) {
        scrollTarget.removeEventListener('scroll', handleScroll);
      }
    };
  }, [tableRef]);
};

export default useMenuCloseOnScroll;
