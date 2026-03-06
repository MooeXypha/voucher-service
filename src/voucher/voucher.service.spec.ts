import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { Voucher } from './entities/voucher.entity';
import { QueryVoucherDto } from './dto/query-voucher.dto';

@Injectable()
export class VoucherService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
  ) {}

  private async generateVoucherId(): Promise<string> {
    const lastVoucher = await this.voucherRepository
      .createQueryBuilder('voucher')
      .orderBy('voucher.id', 'DESC')
      .getOne();

    if (!lastVoucher) {
      return 'PBV-0001';
    }

    const lastNumber = parseInt(lastVoucher.id.split('-')[1], 10);
    const newNumber = lastNumber + 1;

    return `PBV-${newNumber.toString().padStart(4, '0')}`;
  }

  private validateBusinessRules(dto: CreateVoucherDto | UpdateVoucherDto) {
    if (dto.buyerName !== undefined && dto.buyerName.trim().length < 2) {
      throw new BadRequestException('buyerName must be at least 2 characters');
    }

    if (dto.accountUserName !== undefined && dto.accountUserName.trim().length < 2) {
      throw new BadRequestException('accountUserName must be at least 2 characters');
    }

    if (dto.amountPaid !== undefined && dto.amountPaid < 0) {
      throw new BadRequestException('amountPaid must be greater than or equal to 0');
    }

    if (dto.paymentDate !== undefined) {
      const paymentDate = new Date(dto.paymentDate);
      if (isNaN(paymentDate.getTime())) {
        throw new BadRequestException('paymentDate is invalid');
      }
    }
  }

  async create(createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    this.validateBusinessRules(createVoucherDto);

    const duplicate = await this.voucherRepository.findOne({
      where: {
        buyerPhoneNumber: createVoucherDto.buyerPhoneNumber,
        accountUserName: createVoucherDto.accountUserName,
        paymentDate: new Date(createVoucherDto.paymentDate),
      },
    });

    if (duplicate) {
      throw new BadRequestException(
        'Duplicate voucher found for the same phone number, account username, and payment date',
      );
    }

    const voucherId = await this.generateVoucherId();

    const voucher = this.voucherRepository.create({
      id: voucherId,
      buyerName: createVoucherDto.buyerName.trim(),
      buyerPhoneNumber: createVoucherDto.buyerPhoneNumber.trim(),
      serviceType: createVoucherDto.serviceType.trim(),
      accountCategory: createVoucherDto.accountCategory.trim(),
      accountUserName: createVoucherDto.accountUserName.trim(),
      amountPaid: createVoucherDto.amountPaid,
      prepaid: createVoucherDto.prepaid,
      paymentMethod: createVoucherDto.paymentMethod.trim(),
      paymentDate: new Date(createVoucherDto.paymentDate),
      remark: createVoucherDto.remark?.trim() || null,
    });

    return await this.voucherRepository.save(voucher);
  }

async findAll(query: QueryVoucherDto) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  const queryBuilder = this.voucherRepository.createQueryBuilder('voucher');

  if (query.search) {
    queryBuilder.andWhere(
      `(
        voucher.id ILIKE :search
        OR voucher.buyerName ILIKE :search
        OR voucher.buyerPhoneNumber ILIKE :search
        OR voucher.accountUserName ILIKE :search
      )`,
      { search: `%${query.search}%` },
    );
  }

  if (query.serviceType) {
    queryBuilder.andWhere('voucher.serviceType ILIKE :serviceType', {
      serviceType: `%${query.serviceType}%`,
    });
  }

  queryBuilder.orderBy('voucher.createdAt', 'DESC');
  queryBuilder.skip(skip).take(limit);

  const [data, total] = await queryBuilder.getManyAndCount();

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
  async findOne(id: string): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({
      where: { id },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    return voucher;
  }

  async update(id: string, updateVoucherDto: UpdateVoucherDto): Promise<Voucher> {
    const voucher = await this.findOne(id);

    this.validateBusinessRules(updateVoucherDto);

    if (
      updateVoucherDto.buyerPhoneNumber ||
      updateVoucherDto.accountUserName ||
      updateVoucherDto.paymentDate
    ) {
      const buyerPhoneNumber =
        updateVoucherDto.buyerPhoneNumber ?? voucher.buyerPhoneNumber;
      const accountUserName =
        updateVoucherDto.accountUserName ?? voucher.accountUserName;
      const paymentDate = new Date(
        updateVoucherDto.paymentDate ?? voucher.paymentDate,
      );

      const duplicate = await this.voucherRepository.findOne({
        where: {
          buyerPhoneNumber,
          accountUserName,
          paymentDate,
        },
      });

      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException(
          'Another voucher already exists with the same phone number, account username, and payment date',
        );
      }
    }

    const updatedVoucher = this.voucherRepository.merge(voucher, {
      ...updateVoucherDto,
      ...(updateVoucherDto.buyerName
        ? { buyerName: updateVoucherDto.buyerName.trim() }
        : {}),
      ...(updateVoucherDto.buyerPhoneNumber
        ? { buyerPhoneNumber: updateVoucherDto.buyerPhoneNumber.trim() }
        : {}),
      ...(updateVoucherDto.serviceType
        ? { serviceType: updateVoucherDto.serviceType.trim() }
        : {}),
      ...(updateVoucherDto.accountCategory
        ? { accountCategory: updateVoucherDto.accountCategory.trim() }
        : {}),
      ...(updateVoucherDto.accountUserName
        ? { accountUserName: updateVoucherDto.accountUserName.trim() }
        : {}),
      ...(updateVoucherDto.paymentMethod
        ? { paymentMethod: updateVoucherDto.paymentMethod.trim() }
        : {}),
      ...(updateVoucherDto.paymentDate
        ? { paymentDate: new Date(updateVoucherDto.paymentDate) }
        : {}),
      ...(updateVoucherDto.remark !== undefined
        ? { remark: updateVoucherDto.remark?.trim() || null }
        : {}),
    });

    return await this.voucherRepository.save(updatedVoucher);
  }

  async remove(id: string): Promise<{ message: string }> {
    const voucher = await this.findOne(id);
    await this.voucherRepository.remove(voucher);

    return { message: 'Voucher deleted successfully' };
  }

  

}