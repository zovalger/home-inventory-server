import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../auth/entities';
import { ProductTransactionType } from '../interfaces';
import { ProductBalance } from './product-balance.entity';
import { StatusObject } from 'src/common/interfaces';

@Entity('product_transaction')
export class ProductTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false, default: ProductTransactionType.add })
  type: ProductTransactionType; // add, subtract, unpacking

  @Column('float', { nullable: false, default: 1 })
  quantity: number;

  @Column('float', { nullable: true, default: null })
  remainder: number;

  @Column('date', { nullable: true })
  expirationDate: string;

  @Column('text', { nullable: false, default: StatusObject.active })
  status: StatusObject;

  @Column('text', { nullable: false })
  productBalanceId: string;

  @ManyToOne(() => ProductBalance, (balance) => balance.id, { nullable: false })
  @JoinColumn()
  productBalance: string;

  @Column('text', { nullable: true })
  transactionRefId: string;

  @ManyToOne(() => ProductTransaction)
  @JoinColumn()
  transactionRef: ProductTransaction;

  @Column('text', { nullable: false })
  createById: string;

  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  @JoinColumn()
  createBy: User;

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;
}
