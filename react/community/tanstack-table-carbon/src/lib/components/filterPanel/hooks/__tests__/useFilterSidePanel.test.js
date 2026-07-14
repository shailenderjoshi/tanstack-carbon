import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useFilterSidePanel } from '../useFilterSidePanel';

const makeTable = () => ({
  setColumnFilters: vi.fn(),
  resetColumnFilters: vi.fn(),
});

describe('useFilterSidePanel', () => {
  it('initialises with panel closed and empty applied custom filters', () => {
    const { result } = renderHook(() => useFilterSidePanel(makeTable()));
    expect(result.current.showFilterPanel).toBe(false);
    expect(result.current.appliedCustomFilters).toEqual({});
  });

  it('openFilterPanel sets showFilterPanel to true', () => {
    const { result } = renderHook(() => useFilterSidePanel(makeTable()));
    act(() => result.current.openFilterPanel());
    expect(result.current.showFilterPanel).toBe(true);
  });

  it('closeFilterPanel sets showFilterPanel to false', () => {
    const { result } = renderHook(() => useFilterSidePanel(makeTable()));
    act(() => result.current.openFilterPanel());
    act(() => result.current.closeFilterPanel());
    expect(result.current.showFilterPanel).toBe(false);
  });

  it('toggleFilterPanel toggles the panel open and closed', () => {
    const { result } = renderHook(() => useFilterSidePanel(makeTable()));
    act(() => result.current.toggleFilterPanel());
    expect(result.current.showFilterPanel).toBe(true);
    act(() => result.current.toggleFilterPanel());
    expect(result.current.showFilterPanel).toBe(false);
  });

  it('applyFilters calls table.setColumnFilters with provided filters', () => {
    const table = makeTable();
    const { result } = renderHook(() => useFilterSidePanel(table));
    const filters = [{ id: 'name', value: 'Alice' }];
    act(() => result.current.applyFilters(filters));
    expect(table.setColumnFilters).toHaveBeenCalledWith(filters);
  });

  it('applyFilters calls onColumnFiltersChange when provided', () => {
    const table = makeTable();
    const onColumnFiltersChange = vi.fn();
    const { result } = renderHook(() =>
      useFilterSidePanel(table, onColumnFiltersChange)
    );
    const filters = [{ id: 'name', value: 'Bob' }];
    act(() => result.current.applyFilters(filters));
    expect(onColumnFiltersChange).toHaveBeenCalledWith(filters);
  });

  it('applyFilters does nothing when table is null', () => {
    const { result } = renderHook(() => useFilterSidePanel(null));
    expect(() => act(() => result.current.applyFilters([]))).not.toThrow();
  });

  it('clearFilters calls table.resetColumnFilters', () => {
    const table = makeTable();
    const { result } = renderHook(() => useFilterSidePanel(table));
    act(() => result.current.clearFilters());
    expect(table.resetColumnFilters).toHaveBeenCalled();
  });

  it('clearFilters calls onColumnFiltersChange with empty array when provided', () => {
    const table = makeTable();
    const onColumnFiltersChange = vi.fn();
    const { result } = renderHook(() =>
      useFilterSidePanel(table, onColumnFiltersChange)
    );
    act(() => result.current.clearFilters());
    expect(onColumnFiltersChange).toHaveBeenCalledWith([]);
  });

  it('clearFilters does nothing when table is null', () => {
    const { result } = renderHook(() => useFilterSidePanel(null));
    expect(() => act(() => result.current.clearFilters())).not.toThrow();
  });

  it('arrayFilterFn returns true for empty filterValue', () => {
    const { result } = renderHook(() => useFilterSidePanel(makeTable()));
    const row = { getValue: () => 'active' };
    expect(result.current.arrayFilterFn(row, 'status', [])).toBe(true);
    expect(result.current.arrayFilterFn(row, 'status', null)).toBe(true);
  });

  it('arrayFilterFn returns true when cell value is in filter array', () => {
    const { result } = renderHook(() => useFilterSidePanel(makeTable()));
    const row = { getValue: () => 'active' };
    expect(
      result.current.arrayFilterFn(row, 'status', ['active', 'pending'])
    ).toBe(true);
  });

  it('arrayFilterFn returns false when cell value is not in filter array', () => {
    const { result } = renderHook(() => useFilterSidePanel(makeTable()));
    const row = { getValue: () => 'inactive' };
    expect(
      result.current.arrayFilterFn(row, 'status', ['active', 'pending'])
    ).toBe(false);
  });

  it('wrappedCustomFilters is null when no customFilters provided', () => {
    const { result } = renderHook(() => useFilterSidePanel(makeTable()));
    expect(result.current.wrappedCustomFilters).toBeNull();
  });

  it('wrappedCustomFilters.onApply updates appliedCustomFilters and calls original onApply', () => {
    const onApply = vi.fn();
    const customFilters = { onApply, onReset: vi.fn() };
    const { result } = renderHook(() =>
      useFilterSidePanel(makeTable(), null, customFilters)
    );
    act(() =>
      result.current.wrappedCustomFilters.onApply({ name: 'Alice' }, {})
    );
    expect(result.current.appliedCustomFilters).toEqual({ name: 'Alice' });
    expect(onApply).toHaveBeenCalledWith({ name: 'Alice' }, {});
  });

  it('wrappedCustomFilters.onReset clears appliedCustomFilters and calls original onReset', () => {
    const onReset = vi.fn();
    const customFilters = { onApply: vi.fn(), onReset };
    const { result } = renderHook(() =>
      useFilterSidePanel(makeTable(), null, customFilters)
    );
    act(() =>
      result.current.wrappedCustomFilters.onApply({ name: 'Alice' }, {})
    );
    act(() => result.current.wrappedCustomFilters.onReset({}, {}));
    expect(result.current.appliedCustomFilters).toEqual({});
    expect(onReset).toHaveBeenCalledWith({}, {});
  });

  it('handleRemoveCustomFilter removes a key and calls customFilters.onApply with remainder', () => {
    const onApply = vi.fn();
    const customFilters = { onApply, onReset: vi.fn() };
    const { result } = renderHook(() =>
      useFilterSidePanel(makeTable(), null, customFilters)
    );
    act(() =>
      result.current.wrappedCustomFilters.onApply(
        { name: 'Alice', status: 'active' },
        {}
      )
    );
    act(() => result.current.handleRemoveCustomFilter('name'));
    expect(result.current.appliedCustomFilters).toEqual({ status: 'active' });
    expect(onApply).toHaveBeenLastCalledWith(
      { status: 'active' },
      { changedFilters: [] }
    );
  });

  it('clearCustomFilters clears all and calls customFilters.onReset', () => {
    const onReset = vi.fn();
    const customFilters = { onApply: vi.fn(), onReset };
    const { result } = renderHook(() =>
      useFilterSidePanel(makeTable(), null, customFilters)
    );
    act(() =>
      result.current.wrappedCustomFilters.onApply({ name: 'Alice' }, {})
    );
    act(() => result.current.clearCustomFilters());
    expect(result.current.appliedCustomFilters).toEqual({});
    expect(onReset).toHaveBeenCalledWith({}, { changedFilters: [] });
  });
});
