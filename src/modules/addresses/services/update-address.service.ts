import { AppError } from '../../../core/errors/app-error';

import type { UpdateAddressDto } from '../dtos/update-address.dto';
import { mapAddress } from '../mappers/address.mapper';
import { addressesRepository } from '../repositories/addresses.repository';

export class UpdateAddressService {
  async execute(
    userId: string,
    addressId: string,
    data: UpdateAddressDto,
  ) {
    const address = await addressesRepository.findByIdAndUserId(
      addressId,
      userId,
    );

    if (!address || !address.isActive) {
      throw new AppError(
        'Address not found.',
        404,
        'ADDRESS_NOT_FOUND',
      );
    }

    const updatedAddress = await addressesRepository.update(
      addressId,
      {
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
      },
    );

    return mapAddress(updatedAddress);
  }
}

export const updateAddressService =
  new UpdateAddressService();
