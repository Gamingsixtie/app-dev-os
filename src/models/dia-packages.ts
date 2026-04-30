export interface DiaPackage {
  id: string;
  name: string;
  includedModuleIds: string[];
  pricePerStudent: number;
  minModules: number;
  /** Short description of what's included beyond the base modules */
  description?: string;
}

export interface DiaPackageResult {
  selectedPackage: DiaPackage | null;
  totalCost: number;
  individualTotal: number;
  savings: number;
  coveredModuleIds: string[];
}
