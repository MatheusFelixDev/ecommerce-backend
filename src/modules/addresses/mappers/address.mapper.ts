import type { Address } from '../../../generated/prisma/client';

export function mapAddress(address: Address) {
  return {
    id: address.id,
    userId: address.userId,
    label: address.label,
    recipientName: address.recipientName,
    phone: address.phone,
    zipCode: address.zipCode,
    street: address.street,
    number: address.number,
    complement: address.complement,
    neighborhood: address.neighborhood,
    city: address.city,
    state: address.state,
    country: address.country,
    isMain: address.isMain,
    isActive: address.isActive,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}

export function mapAddresses(addresses: Address[]) {
  return addresses.map(mapAddress);
}
