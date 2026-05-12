import type { CreateAddressDto } from '../dtos/create-address.dto';
import { mapAddress } from '../mappers/address.mapper';
import { addressesRepository } from '../repositories/addresses.repository';

export class CreateAddressService {
  async execute(userId: string, data: CreateAddressDto) {
    const activeAddressesCount =
      await addressesRepository.countActiveByUserId(userId);

    const shouldBeMain =
      activeAddressesCount === 0 || data.isMain === true;

    if (shouldBeMain) {
      await addressesRepository.unsetMainByUserId(userId);
    }

    const address = await addressesRepository.create({
      userId,
      label: data.label,
      recipientName: data.recipientName,
      phone: data.phone,
      zipCode: data.zipCode,
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      country: data.country,
      isMain: shouldBeMain,
    });

    return mapAddress(address);
  }
}

export const createAddressService =
  new CreateAddressService();
