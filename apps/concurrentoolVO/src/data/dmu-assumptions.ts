import type { DmuTarget } from '@/features/export/types';

export interface DmuAssumption {
  id: string;
  dmuTarget: DmuTarget;
  introText: string;
  focusAreas: string[];
  editable: boolean;
}

export const DMU_ASSUMPTIONS: DmuAssumption[] = [
  {
    id: 'coordinator-intro',
    dmuTarget: 'coordinator',
    introText:
      'Als dagelijks gebruiker van het toetssysteem is tijdwinst en gebruiksgemak het meest relevant voor u. Dit rapport laat zien hoeveel tijd uw team bespaart met Cito en welke praktische voordelen het platform biedt voor de dagelijkse toetspraktijk.',
    focusAreas: [
      'Tijdwinst in dagelijkse taken',
      'Gebruiksvriendelijkheid',
      'Integratie met bestaande systemen',
    ],
    editable: true,
  },
  {
    id: 'mt-intro',
    dmuTarget: 'mt',
    introText:
      'Als beslisser op strategisch niveau is het belangrijk te weten hoe Cito bijdraagt aan de langetermijndoelen van uw school. Dit rapport toont de strategische waarde, toekomstbestendigheid en het totaalplaatje van kosten en baten.',
    focusAreas: [
      'Strategische waarde',
      'Toekomstbestendigheid',
      'Totaalplaatje kosten en baten',
    ],
    editable: true,
  },
  {
    id: 'finance-intro',
    dmuTarget: 'finance',
    introText:
      'Dit rapport is opgesteld met focus op de financiele onderbouwing. U vindt hier de exacte kostenopbouw, het verschil met alternatieven, de terugverdientijd en een meerjarenprojectie van de investering.',
    focusAreas: [
      'Kostenopbouw en vergelijking',
      'Return on investment',
      'Meerjarenprojectie',
    ],
    editable: true,
  },
  {
    id: 'generiek-intro',
    dmuTarget: 'generiek',
    introText:
      'Dit rapport geeft een compleet overzicht van de vergelijking tussen Cito en andere aanbieders. U vindt zowel de financiele als inhoudelijke onderbouwing voor de keuze voor Cito.',
    focusAreas: [
      'Prijsvergelijking',
      'Inhoudelijke meerwaarde',
      'Tijdwinst',
    ],
    editable: true,
  },
];

/**
 * Get default assumptions for a specific DMU target role.
 */
export function getDefaultAssumptions(dmuTarget: DmuTarget): DmuAssumption[] {
  return DMU_ASSUMPTIONS.filter((a) => a.dmuTarget === dmuTarget);
}
