import type { SchoolLevel } from '../models/school';

export interface SchoolSizePreset {
  id: 'klein' | 'midden' | 'groot';
  label: string;
  description: string;
  totalStudents: string;
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>;
}

export const SCHOOL_SIZE_PRESETS: SchoolSizePreset[] = [
  {
    id: 'klein',
    label: 'Klein VO',
    description: 'Tot ~500 leerlingen',
    totalStudents: '300-500',
    studentCounts: {
      'havo': { 1: 30, 2: 28, 3: 26, 4: 24, 5: 22 },
      'vwo': { 1: 25, 2: 24, 3: 22, 4: 20, 5: 18, 6: 16 },
    },
  },
  {
    id: 'midden',
    label: 'Middelgroot VO',
    description: '500-1200 leerlingen',
    totalStudents: '500-1200',
    studentCounts: {
      'vmbo-gt': { 1: 50, 2: 48, 3: 45, 4: 42 },
      'havo': { 1: 55, 2: 52, 3: 48, 4: 45, 5: 40 },
      'vwo': { 1: 40, 2: 38, 3: 35, 4: 32, 5: 28, 6: 25 },
    },
  },
  {
    id: 'groot',
    label: 'Groot VO',
    description: '1200+ leerlingen',
    totalStudents: '1200+',
    studentCounts: {
      'vmbo-b': { 1: 40, 2: 38, 3: 35, 4: 30 },
      'vmbo-k': { 1: 45, 2: 42, 3: 40, 4: 35 },
      'vmbo-gt': { 1: 70, 2: 65, 3: 60, 4: 55 },
      'havo': { 1: 80, 2: 75, 3: 70, 4: 65, 5: 55 },
      'vwo': { 1: 60, 2: 55, 3: 50, 4: 48, 5: 42, 6: 38 },
    },
  },
];
