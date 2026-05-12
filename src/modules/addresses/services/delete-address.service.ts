import { AppError } from '../../../core/errors/app-error';

import { addressesRepository } from '../repositories/addresses.repository';

export class DeleteAddressService {
  async execute(userId: string, addressId: string): Promise<void> {
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

    await addressesRepository.softDelete(addressId);

    if (address.isMain) {
      const remainingAddresses =
        await addressesRepository.findManyByUserId(userId);

      const nextMainAddress = remainingAddresses[0];

      if (nextMainAddress) {
        await addressesRepository.setMain(nextMainAddress.id);
      }
    }
  }
}

export const deleteAddressService =
  new DeleteAddressService();
