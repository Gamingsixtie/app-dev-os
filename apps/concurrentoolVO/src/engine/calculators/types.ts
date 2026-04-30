export interface PriceBreakdownStep {
  /** Dutch explanation of this pricing step */
  label: string;
  /** Euro amount for this step */
  amount: number;
}

export interface ModulePriceResult {
  pricePerStudent: number;
  totalCost: number;
  breakdown: PriceBreakdownStep[];
  isPackagePrice: boolean;
  packageId?: string;
  tierId?: number;
}

export interface ProviderPriceCalculator {
  calculateModule(
    moduleId: string,
    totalStudents: number,
    overridePrice?: number,
  ): ModulePriceResult | null;

  calculateAll(
    selectedModuleIds: string[],
    totalStudents: number,
    overridePrices?: Map<string, number>,
  ): Map<string, ModulePriceResult>;
}
