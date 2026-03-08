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
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'buyerPhoneNumber must be a valid international phone number (E.164 format, e.g. +14155552671)',
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