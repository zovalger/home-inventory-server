import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { UpdateFamilyDto } from '../../dto';
import { ResMessages } from '../../../common/providers';

@Injectable()
export class UpdateFamilyPipe implements PipeTransform {
  transform(value: UpdateFamilyDto) {
    const name = value.name ? value.name.trim() : undefined;

    const imageUrl = value.imageUrl
      ? value.imageUrl
      : value.imageUrl === null
        ? null
        : undefined;

    if (!name && !imageUrl && imageUrl != null)
      throw new BadRequestException(ResMessages.objectEmpty);

    return { ...value, name, imageUrl };
  }
}
