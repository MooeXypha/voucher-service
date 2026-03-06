import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('voucher')
export class Voucher {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column({ name: 'buyer_name', type: 'varchar', length: 100, unique: true })
  buyerName: string;

  @Column({ name: 'buyer_phone_number', type: 'varchar', length: 20, unique: true })
  buyerPhoneNumber: string;

  @Column({ name: 'service_type', type: 'varchar', length: 100 })
  serviceType: string;

  @Column({ name: 'account_category', type: 'varchar', length: 100 })
  accountCategory: string;

  @Column({ name: 'account_username', type: 'varchar', length: 100 })
  accountUserName: string;

  @Column({ name: 'amount_paid', type: 'int' })
  amountPaid: number;

  @Column({ type: 'boolean', default: false })
  prepaid: boolean;

  @Column({ name: 'payment_method', type: 'varchar', length: 50 })
  paymentMethod: string;

  @Column({ name: 'payment_date', type: 'timestamp' })
  paymentDate: Date;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}