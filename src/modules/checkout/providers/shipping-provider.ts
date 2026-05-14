export interface ShippingProviderProduct {
  id: string;
  name: string;
  quantity: number;
  priceInCents: number;
  weightInGrams: number | null;
  widthCm: number | null;
  heightCm: number | null;
  lengthCm: number | null;
}

export interface CalculateShippingProviderRequest {
  to: {
    zipCode: string;
  };
  products: ShippingProviderProduct[];
}

export interface ShippingOption {
  provider: string;
  serviceCode: string;
  serviceName: string;
  priceInCents: number;
  deadlineDays: number;
}

export interface ShippingProvider {
  calculate(
    data: CalculateShippingProviderRequest,
  ): Promise<ShippingOption[]>;
}
