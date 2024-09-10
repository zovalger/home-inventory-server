import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../auth/entities';
import { ProductEquivalence } from './product-equivalence.entity';
import { UnitOfMeasurement } from '../interfaces';
import { ProductTransaction } from './product-transaction.entity';
import { Company } from 'src/company/entities';
import { StatusObject } from 'src/common/interfaces';
import { ProductBalance } from './product-balance.entity';

@Entity('product')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false })
  name: string;

  @Column('text', { nullable: true })
  brand: string;

  @Column('text', { nullable: true })
  model: string;

  @Column('float', { nullable: true, default: 0 })
  cost: number;

  @Column('float', { nullable: true, default: 0 })
  minQuantity: number;

  @Column('float', { nullable: true, default: null })
  maxQuantity: number;

  @Column('text', { nullable: true, default: UnitOfMeasurement.unit })
  unitOfMeasurement: UnitOfMeasurement;

  @Column('bool', { nullable: false, default: false })
  divisible: boolean;

  @Column('text', { nullable: false, default: StatusObject.active })
  status: StatusObject;

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;

  // ****************** relaciones ******************

  @Column('text', { nullable: false })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.id)
  company: Company;

  @Column('text', { nullable: false })
  createById: string;

  @Column('text', { nullable: true })
  imageUrl: string;

  @OneToMany(() => ProductTransaction, (transaction) => transaction.productId)
  transactions: ProductTransaction[];

  @OneToMany(() => ProductBalance, (productBalance) => productBalance.productId)
  balances: ProductBalance[];

  // @ManyToOne(() => File, { cascade: true })
  // @JoinColumn({ referencedColumnName: 'url' })
  // image?: File;

  // donde el producto es padre
  @OneToOne(() => ProductEquivalence, (productEq) => productEq.from, {
    eager: true,
  })
  productEq_From: ProductEquivalence;

  // donde el producto es hijo
  @OneToOne(() => ProductEquivalence, (productEq) => productEq.to, {
    eager: true,
  })
  productEq_To: ProductEquivalence;

  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  createBy: User;
}
