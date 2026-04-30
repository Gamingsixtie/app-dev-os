import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SchoolPickerDialog from '../../SchoolPickerDialog';
import { useSchoolListStore } from '../../school-list-store';

describe('SchoolPickerDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Seed the school list store with test entries
    useSchoolListStore.setState({
      entries: [
        { id: '1', name: 'Montessori College', city: 'Amsterdam', region: 'Noord-Holland', brinCode: '01AA', levels: 'HAVO/VWO', studentCount: 500 },
        { id: '2', name: 'Gymnasium Haganum', city: 'Den Haag', region: 'Zuid-Holland', brinCode: '02BB', levels: 'VWO', studentCount: 800 },
        { id: '3', name: 'VMBO Het Streek', city: 'Ede', region: 'Gelderland', brinCode: '03CC', levels: 'VMBO', studentCount: 300 },
      ],
      fileName: 'scholen.csv',
      importedAt: '2026-01-01',
    });
  });

  it('renders dialog with title', () => {
    render(<SchoolPickerDialog onClose={mockOnClose} onSelect={mockOnSelect} />);
    expect(screen.getByText('School selecteren')).toBeInTheDocument();
  });

  it('shows list of schools', () => {
    render(<SchoolPickerDialog onClose={mockOnClose} onSelect={mockOnSelect} />);
    expect(screen.getByText('Montessori College')).toBeInTheDocument();
    expect(screen.getByText('Gymnasium Haganum')).toBeInTheDocument();
    expect(screen.getByText('VMBO Het Streek')).toBeInTheDocument();
  });

  it('search filters school list', async () => {
    const user = userEvent.setup();
    render(<SchoolPickerDialog onClose={mockOnClose} onSelect={mockOnSelect} />);

    const searchInput = screen.getByPlaceholderText('Zoek op naam, plaats, BRIN-code...');
    await user.type(searchInput, 'Gymnasium');

    expect(screen.getByText('Gymnasium Haganum')).toBeInTheDocument();
    expect(screen.queryByText('Montessori College')).not.toBeInTheDocument();
    expect(screen.queryByText('VMBO Het Streek')).not.toBeInTheDocument();
  });

  it('selecting a school calls onSelect callback', async () => {
    const user = userEvent.setup();
    render(<SchoolPickerDialog onClose={mockOnClose} onSelect={mockOnSelect} />);

    await user.click(screen.getByText('Gymnasium Haganum'));
    expect(mockOnSelect).toHaveBeenCalledWith('Gymnasium Haganum');
  });

  it('"Annuleren" closes dialog', async () => {
    const user = userEvent.setup();
    render(<SchoolPickerDialog onClose={mockOnClose} onSelect={mockOnSelect} />);

    await user.click(screen.getByText('Annuleren'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('close button (X) closes dialog', async () => {
    const user = userEvent.setup();
    render(<SchoolPickerDialog onClose={mockOnClose} onSelect={mockOnSelect} />);

    await user.click(screen.getByLabelText('Sluiten'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows result count footer', () => {
    render(<SchoolPickerDialog onClose={mockOnClose} onSelect={mockOnSelect} />);
    expect(screen.getByText('3 van 3 scholen')).toBeInTheDocument();
  });

  it('search by city filters correctly', async () => {
    const user = userEvent.setup();
    render(<SchoolPickerDialog onClose={mockOnClose} onSelect={mockOnSelect} />);

    const searchInput = screen.getByPlaceholderText('Zoek op naam, plaats, BRIN-code...');
    await user.type(searchInput, 'Amsterdam');

    expect(screen.getByText('Montessori College')).toBeInTheDocument();
    expect(screen.queryByText('Gymnasium Haganum')).not.toBeInTheDocument();
  });
});
