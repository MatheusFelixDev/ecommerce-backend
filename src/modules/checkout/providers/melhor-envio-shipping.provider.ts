import { AppError } from '../../../core/errors/app-error';
import { env } from '../../../config/env';

import type {
  CalculateShippingProviderRequest,
  ShippingOption,
  ShippingProvider,
  ShippingProviderProduct,
} from './shipping-provider';

interface MelhorEnvioShippingResponseItem {
  id?: number | string;
  name?: string;
  price?: string | number;
  custom_price?: string | number;
  delivery_time?: number;
  custom_delivery_time?: number;
  error?: string;
}

interface MelhorEnvioProductPayload {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
}

export class MelhorEnvioShippingProvider
  implements ShippingProvider
{
  async calculate(
    data: CalculateShippingProviderRequest,
  ): Promise<ShippingOption[]> {
    this.ensureConfigured();

    const products = data.products.map((product) =>
      this.toMelhorEnvioProductPayload(product),
    );

    const response = await fetch(
      this.buildCalculateShippingUrl(),
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.melhorEnvioAccessToken}`,
          'User-Agent': env.melhorEnvioUserAgent,
        },
        body: JSON.stringify({
          from: {
            postal_code: this.sanitizeZipCode(
              env.melhorEnvioOriginZipCode,
            ),
          },
          to: {
            postal_code: this.sanitizeZipCode(data.to.zipCode),
          },
          products,
        }),
      },
    );

    if (!response.ok) {
      throw new AppError(
        'Shipping calculation failed.',
        502,
        'SHIPPING_CALCULATION_FAILED',
      );
    }

    const result =
      (await response.json()) as MelhorEnvioShippingResponseItem[];

    if (!Array.isArray(result)) {
      throw new AppError(
        'Invalid shipping provider response.',
        502,
        'INVALID_SHIPPING_PROVIDER_RESPONSE',
      );
    }

    const options = result
      .filter((item) => !item.error)
      .map((item) => this.toShippingOption(item))
      .filter((option): option is ShippingOption => option !== null);

    if (options.length === 0) {
      throw new AppError(
        'No shipping options available.',
        400,
        'SHIPPING_OPTION_NOT_FOUND',
      );
    }

    return options;
  }

  private ensureConfigured(): void {
    if (!env.melhorEnvioEnabled) {
      throw new AppError(
        'Shipping provider is disabled.',
        500,
        'SHIPPING_PROVIDER_DISABLED',
      );
    }

    if (
      !env.melhorEnvioBaseUrl ||
      !env.melhorEnvioAccessToken ||
      !env.melhorEnvioUserAgent ||
      !env.melhorEnvioOriginZipCode
    ) {
      throw new AppError(
        'Shipping provider is not configured.',
        500,
        'SHIPPING_PROVIDER_NOT_CONFIGURED',
      );
    }
  }

  private buildCalculateShippingUrl(): string {
    return new URL(
      '/api/v2/me/shipment/calculate',
      env.melhorEnvioBaseUrl,
    ).toString();
  }

  private toMelhorEnvioProductPayload(
    product: ShippingProviderProduct,
  ): MelhorEnvioProductPayload {
    if (
      product.weightInGrams === null ||
      product.widthCm === null ||
      product.heightCm === null ||
      product.lengthCm === null
    ) {
      throw new AppError(
        'Product shipping data is missing.',
        400,
        'PRODUCT_SHIPPING_DATA_MISSING',
      );
    }

    return {
      id: product.id,
      width: product.widthCm,
      height: product.heightCm,
      length: product.lengthCm,
      weight: product.weightInGrams / 1000,
      insurance_value: product.priceInCents / 100,
      quantity: product.quantity,
    };
  }

  private toShippingOption(
    item: MelhorEnvioShippingResponseItem,
  ): ShippingOption | null {
    const priceInCents = this.moneyToCents(
      item.custom_price ?? item.price,
    );

    const deadlineDays = Number(
      item.custom_delivery_time ?? item.delivery_time,
    );

    if (
      item.id === undefined ||
      !item.name ||
      priceInCents === null ||
      Number.isNaN(deadlineDays)
    ) {
      return null;
    }

    return {
      provider: 'MELHOR_ENVIO',
      serviceCode: String(item.id),
      serviceName: item.name,
      priceInCents,
      deadlineDays,
    };
  }

  private moneyToCents(value: unknown): number | null {
    if (typeof value !== 'string' && typeof value !== 'number') {
      return null;
    }

    const normalizedValue =
      typeof value === 'string'
        ? value.replace(',', '.')
        : String(value);

    const parsedValue = Number(normalizedValue);

    if (Number.isNaN(parsedValue)) {
      return null;
    }

    return Math.round(parsedValue * 100);
  }

  private sanitizeZipCode(zipCode: string): string {
    return zipCode.replace(/\D/g, '');
  }
}

export const melhorEnvioShippingProvider =
  new MelhorEnvioShippingProvider();
