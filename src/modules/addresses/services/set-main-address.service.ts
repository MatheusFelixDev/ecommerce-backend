import { AppError } from '../../../core/errors/app-error';

import { mapAddress } from '../mappers/address.mapper';
import { addressesRepository } from '../repositories/addresses.repository';

export class SetMainAddressService {
  async execute(userId: string, addressId: string) {
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

    await addressesRepository.unsetMainByUserId(userId);

    const mainAddress = await addressesRepository.setMain(addressId);

    return mapAddress(mainAddress);
  }
}

export const setMainAddressService =
  new SetMainAddressService();
