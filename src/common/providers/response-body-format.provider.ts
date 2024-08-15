import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponseBodyFormat {
  basic(message?: string, data?: any) {
    const responseData = { message, data: undefined };

    if (data) responseData.data = data;

    return responseData;
  }

  withToken(token: string, message?: string, data?: any) {
    const responseData = this.basic(message, data);

    return { ...responseData, token };
  }

  withQuery() {}
}
