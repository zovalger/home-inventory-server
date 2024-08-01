import { IsString, MaxLength, MinLength } from 'class-validator';

export class VerificationCodeDto {
  @IsString()
  @MinLength(4)
  @MaxLength(4)
  code: string;
}
