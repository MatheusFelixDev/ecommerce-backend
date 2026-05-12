import { mapAddresses } from '../mappers/address.mapper';
import { addressesRepository } from '../repositories/addresses.repository';

export class ListAddressesService {
  async execute(userId: string) {
    const addresses =
      await addressesRepository.findManyByUserId(userId);

    return mapAddresses(addresses);
  }
}

export const listAddressesService =
  new ListAddressesService();
