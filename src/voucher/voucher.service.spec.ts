import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { Voucher } from './entities/voucher.entity';

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

  async create(createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    const voucherId = await this.generateVoucherId();

    const voucher = this.voucherRepository.create({
      id: voucherId,
      ...createVoucherDto,
      paymentDate: new Date(createVoucherDto.paymentDate),
    });

    return await this.voucherRepository.save(voucher);
  }

  async findAll(): Promise<Voucher[]> {
    return await this.voucherRepository.find({
      order: { paymentDate: 'DESC' },
    });
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

    const updatedVoucher = this.voucherRepository.merge(voucher, {
      ...updateVoucherDto,
      ...(updateVoucherDto.paymentDate
        ? { paymentDate: new Date(updateVoucherDto.paymentDate) }
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