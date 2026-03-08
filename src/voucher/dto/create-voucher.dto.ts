import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVoucherDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  buyerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^(?=(?:\D*\d){6,20}\D*$)\+?[\d\s()-]+$/, {
    message:
      'buyerPhoneNumber format is invalid. Use 6-20 digits and optional +, spaces, dashes, or parentheses',
  })
  buyerPhoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serviceType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  accountCategory: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  accountUserName: string;

  @IsInt()
  @Min(0)
  amountPaid: number;

  @IsBoolean()
  prepaid: boolean;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  paymentMethod: string;

  @IsDateString()
  paymentDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}