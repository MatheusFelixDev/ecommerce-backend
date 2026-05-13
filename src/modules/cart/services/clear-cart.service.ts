import { cartRepository } from '../repositories/cart.repository';
import { listCartService } from './list-cart.service';

interface ClearCartServiceRequest {
  userId: string;
}

export class ClearCartService {
  async execute({ userId }: ClearCartServiceRequest) {
    await cartRepository.deleteManyByUserId(userId);

    return listCartService.execute({
      userId,
    });
  }
}

export const clearCartService =
  new ClearCartService();
