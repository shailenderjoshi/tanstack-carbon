import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FilterTagsSummary from '../filterTagsSummary';

vi.mock('../../constants/constants', () => ({
  MAX_VISIBLE_FILTER_TAGS: 3,
}));

vi.mock('@carbon/react', () => ({
  DismissibleTag: ({ text, onClose, 'data-testid': testId }) => (
    <span data-testid={testId} onClick={onClose}>
      {text}
    </span>
  ),
  Tag: ({ children, onClick }) => <span onClick={onClick}>{children}</span>,
  Button: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('../scss/filterTagsSummary.module.scss', () => ({ default: {} }));

const makeTable = (columns = {}) => ({
  getColumn: vi.fn((id) =>
    columns[id]
      ? { columnDef: { header: columns[id] } }
      : { columnDef: { header: id } }
  ),
});

const baseProps = (overrides = {}) => ({
  columnFilters: [],
  onRemoveFilter: vi.fn(),
  onClearAll: vi.fn(),
  table: makeTable(),
  appliedCustomFilters: {},
  onRemoveCustomFilter: vi.fn(),
  onClearCustomFilters: vi.fn(),
  ...overrides,
});

describe('FilterTagsSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no column or custom filters are active', () => {
    const { container } = render(<FilterTagsSummary {...baseProps()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a tag for each active column filter (single value)', () => {
    const props = baseProps({
      columnFilters: [{ id: 'name', value: 'Alice' }],
      table: makeTable({ name: 'Name' }),
    });
    render(<FilterTagsSummary {...props} />);
    expect(screen.getByTestId('filter-tag-name')).toBeInTheDocument();
    expect(screen.getByText('Name: Alice')).toBeInTheDocument();
  });

  it('renders a tag per value for array column filters', () => {
    const props = baseProps({
      columnFilters: [{ id: 'status', value: ['active', 'pending'] }],
      table: makeTable({ status: 'Status' }),
    });
    render(<FilterTagsSummary {...props} />);
    expect(screen.getByText('Status: active')).toBeInTheDocument();
    expect(screen.getByText('Status: pending')).toBeInTheDocument();
  });

  it('formats slider filter value as min – max', () => {
    const props = baseProps({
      columnFilters: [{ id: 'age', value: { min: 10, max: 50 } }],
    });
    render(<FilterTagsSummary {...props} />);
    expect(screen.getByText(/10.*50/)).toBeInTheDocument();
  });

  it('formats dateRange filter value as start – end', () => {
    const props = baseProps({
      columnFilters: [
        { id: 'date', value: { start: '2024-01-01', end: '2024-12-31' } },
      ],
    });
    render(<FilterTagsSummary {...props} />);
    expect(screen.getByTestId('filter-tag-date')).toBeInTheDocument();
  });

  it('formats dateRange with only start defined', () => {
    const props = baseProps({
      columnFilters: [{ id: 'date', value: { start: '2024-01-01' } }],
    });
    render(<FilterTagsSummary {...props} />);
    expect(screen.getByTestId('filter-tag-date')).toBeInTheDocument();
  });

  it('calls onRemoveFilter when a column filter tag is dismissed', () => {
    const onRemoveFilter = vi.fn();
    const props = baseProps({
      columnFilters: [{ id: 'name', value: 'Alice' }],
      onRemoveFilter,
    });
    render(<FilterTagsSummary {...props} />);
    fireEvent.click(screen.getByTestId('filter-tag-name'));
    expect(onRemoveFilter).toHaveBeenCalledWith('name', 'Alice', false);
  });

  it('calls onRemoveFilter with isArray=true for array filter tags', () => {
    const onRemoveFilter = vi.fn();
    const props = baseProps({
      columnFilters: [{ id: 'status', value: ['active'] }],
      onRemoveFilter,
    });
    render(<FilterTagsSummary {...props} />);
    fireEvent.click(screen.getByTestId('filter-tag-status'));
    expect(onRemoveFilter).toHaveBeenCalledWith('status', 'active', true);
  });

  it('renders custom filter tags for non-empty appliedCustomFilters', () => {
    const props = baseProps({
      appliedCustomFilters: { department: 'Engineering' },
    });
    render(<FilterTagsSummary {...props} />);
    expect(screen.getByTestId('filter-tag-department')).toBeInTheDocument();
  });

  it('filters out empty/null/undefined custom filter values', () => {
    const props = baseProps({
      appliedCustomFilters: { a: '', b: null, c: undefined, d: [] },
    });
    const { container } = render(<FilterTagsSummary {...props} />);
    expect(container.firstChild).toBeNull();
  });

  it('filters out custom filter objects where all values are falsy', () => {
    const props = baseProps({
      appliedCustomFilters: { range: { start: undefined, end: undefined } },
    });
    const { container } = render(<FilterTagsSummary {...props} />);
    expect(container.firstChild).toBeNull();
  });

  it('keeps custom filter object where at least one value is truthy', () => {
    const props = baseProps({
      appliedCustomFilters: { range: { start: '2024-01-01', end: undefined } },
    });
    render(<FilterTagsSummary {...props} />);
    expect(screen.getByTestId('filter-tag-range')).toBeInTheDocument();
  });

  it('calls onRemoveCustomFilter when a custom filter tag is dismissed', () => {
    const onRemoveCustomFilter = vi.fn();
    const props = baseProps({
      appliedCustomFilters: { department: 'Engineering' },
      onRemoveCustomFilter,
    });
    render(<FilterTagsSummary {...props} />);
    fireEvent.click(screen.getByTestId('filter-tag-department'));
    expect(onRemoveCustomFilter).toHaveBeenCalledWith('department');
  });

  it('calls onClearAll and onClearCustomFilters when Clear filters is clicked', () => {
    const onClearAll = vi.fn();
    const onClearCustomFilters = vi.fn();
    const props = baseProps({
      columnFilters: [{ id: 'name', value: 'Alice' }],
      appliedCustomFilters: { dept: 'Eng' },
      onClearAll,
      onClearCustomFilters,
    });
    render(<FilterTagsSummary {...props} />);
    fireEvent.click(screen.getByText('Clear filters'));
    expect(onClearAll).toHaveBeenCalled();
    expect(onClearCustomFilters).toHaveBeenCalled();
  });

  it('shows +N more tag when filters exceed MAX_VISIBLE_FILTER_TAGS', () => {
    const props = baseProps({
      columnFilters: [
        { id: 'a', value: '1' },
        { id: 'b', value: '2' },
        { id: 'c', value: '3' },
        { id: 'd', value: '4' },
      ],
    });
    render(<FilterTagsSummary {...props} />);
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('shows all tags and Show less after clicking +N more', () => {
    const props = baseProps({
      columnFilters: [
        { id: 'a', value: '1' },
        { id: 'b', value: '2' },
        { id: 'c', value: '3' },
        { id: 'd', value: '4' },
      ],
    });
    render(<FilterTagsSummary {...props} />);
    fireEvent.click(screen.getByText('+1 more'));
    expect(screen.getByText('Show less')).toBeInTheDocument();
    expect(screen.queryByText('+1 more')).not.toBeInTheDocument();
  });

  it('collapses back after clicking Show less', () => {
    const props = baseProps({
      columnFilters: [
        { id: 'a', value: '1' },
        { id: 'b', value: '2' },
        { id: 'c', value: '3' },
        { id: 'd', value: '4' },
      ],
    });
    render(<FilterTagsSummary {...props} />);
    fireEvent.click(screen.getByText('+1 more'));
    fireEvent.click(screen.getByText('Show less'));
    expect(screen.getByText('+1 more')).toBeInTheDocument();
    expect(screen.queryByText('Show less')).not.toBeInTheDocument();
  });
});
