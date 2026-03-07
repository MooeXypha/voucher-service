import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryFailedError } from 'typeorm';
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

  async create(createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    // Generate next ID in format PBV-0001
    const vouchers = await this.voucherRepository.find({ select: ['id'] });
    const numbers = vouchers.map(v => parseInt(v.id.split('-')[1]) || 0);
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNum = maxNum + 1;
    const id = `PBV-${nextNum.toString().padStart(4, '0')}`;

    const voucher = this.voucherRepository.create({ ...createVoucherDto, id });
    try {
      return await this.voucherRepository.save(voucher);
    } catch (error) {
      if (error instanceof QueryFailedError && error.driverError?.code === '23505') {
        throw new BadRequestException('Buyer name or phone number already exists');
      }
      throw error;
    }
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
        OR voucher.accountCategory ILIKE :search
        OR voucher.paymentMethod ILIKE :search
        OR voucher.remark ILIKE :search
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
    const voucher = await this.voucherRepository.findOne({ where: { id } });
    if (!voucher) {
      throw new NotFoundException(`Voucher with ID Number ${id} not found`);
    }
    return voucher;
  }

  async update(id: string, updateVoucherDto: UpdateVoucherDto): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({ where: { id } });
    if (!voucher) {
      throw new NotFoundException(`Voucher with ID Number ${id} not found`);
    }
    Object.assign(voucher, updateVoucherDto);
    return this.voucherRepository.save(voucher);
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.voucherRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Voucher with ID Number ${id} not found`);
    }
    return { message: 'Voucher deleted successfully' };
  }
}
