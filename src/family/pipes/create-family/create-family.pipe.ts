import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { CreateFamilyDto } from '../../dto';

@Injectable()
export class CreateFamilyPipe implements PipeTransform {
  transform(value: CreateFamilyDto) {
    const name = value.name && value.name.trim();

    if (!name) throw new BadRequestException('bad name');

    const imageUrl = value.imageUrl ? value.imageUrl : null;

    return { ...value, name, imageUrl };
  }
}
