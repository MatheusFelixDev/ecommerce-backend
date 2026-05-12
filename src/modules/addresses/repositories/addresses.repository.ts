import type { Address, Prisma } from '../../../generated/prisma/client';

import { prisma } from '../../../infra/prisma/client';

interface CreateAddressData {
  userId: string;
  label?: string;
  recipientName?: string;
  phone?: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  country?: string;
  isMain: boolean;
}

export class AddressesRepository {
  async countActiveByUserId(userId: string): Promise<number> {
    return prisma.address.count({
      where: {
        userId,
        isActive: true,
      },
    });
  }

  async findManyByUserId(userId: string): Promise<Address[]> {
    return prisma.address.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: [
        {
          isMain: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<Address | null> {
    return prisma.address.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async create(data: CreateAddressData): Promise<Address> {
    return prisma.address.create({
      data,
    });
  }

  async update(
    id: string,
    data: Prisma.AddressUpdateInput,
  ): Promise<Address> {
    return prisma.address.update({
      where: {
        id,
      },
      data,
    });
  }

  async softDelete(id: string): Promise<Address> {
    return prisma.address.update({
      where: {
        id,
      },
      data: {
        isActive: false,
        isMain: false,
      },
    });
  }

  async unsetMainByUserId(userId: string): Promise<void> {
    await prisma.address.updateMany({
      where: {
        userId,
        isMain: true,
      },
      data: {
        isMain: false,
      },
    });
  }

  async setMain(id: string): Promise<Address> {
    return prisma.address.update({
      where: {
        id,
      },
      data: {
        isMain: true,
      },
    });
  }
}

export const addressesRepository =
  new AddressesRepository();
