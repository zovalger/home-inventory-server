import { Repository } from 'typeorm';
import { Family } from '../../src/family/entities';

export const getFamily = async (
  familyRepository: Repository<Family>,
  createById: string,
) => {
  const family = await familyRepository.findOneBy({
    createById,
  });

  family.createAt = new Date(family.createAt).toISOString();
  family.updateAt = new Date(family.updateAt).toISOString();

  return family;
};
