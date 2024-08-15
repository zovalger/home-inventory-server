export class CreateUserVerificationCodeDto {
  userId: string;
  code: string;
  expireIn: string;
}
