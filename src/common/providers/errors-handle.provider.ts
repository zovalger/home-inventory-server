import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

export class ErrorHandleProvider {
  handle(error: any) {
    if (error.code == '23505')
      throw new BadRequestException('Is already register');

    if (error.status == 404) throw new NotFoundException(error.response);
    if (error.status == 400) throw new BadRequestException(error.response);

    console.log(error);
    throw new InternalServerErrorException('Check server logs');
  }
}
