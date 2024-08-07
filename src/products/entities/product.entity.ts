import { User } from 'src/auth/entities';
import { Family } from 'src/family/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductStatus } from '../interfaces/product-status.enum';
import { ProductEquivalence } from './product-equivalence.entity';
import { UnitOfMeasurement } from '../interfaces';
import { ProductTransaction } from './product-transaction.entity';
import { File } from 'src/files/entities';

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

  @Column('float', { nullable: false, default: 0 })
  currentQuantity: number;

  @Column('float', { nullable: false, default: 0 })
  relativeQuantity: number;

  @Column('float', { nullable: true, default: 0 })
  minQuantity: number;

  @Column('float', { nullable: true, default: null })
  maxQuantity: number;

  @Column('bool', { nullable: false, default: false })
  divisible: boolean;

  @Column('text', { nullable: false, default: ProductStatus.active })
  status: ProductStatus;

  // ****************** llaves foraneas ******************

  @Column('text', { nullable: true, default: UnitOfMeasurement.unit })
  unitOfMeasurement: UnitOfMeasurement;

  @Column('text', { nullable: false })
  familyId: string;

  @Column('text', { nullable: false })
  createById: string;

  @Column('text', { nullable: true })
  imageUrl: string;

  // ****************** relaciones ******************

  @OneToMany(() => ProductTransaction, (transaction) => transaction.productId)
  transactions: ProductTransaction[];

  @ManyToOne(() => File, { cascade: true })
  @JoinColumn({ referencedColumnName: 'url' })
  image?: File;

  @ManyToOne(() => Family, (family) => family.members)
  family: Family;

  // donde el producto es padre
  @OneToMany(() => ProductEquivalence, (productEq) => productEq.from, {
    eager: true,
  })
  productEq_From: ProductEquivalence;

  // donde el producto es hijo
  @OneToMany(() => ProductEquivalence, (productEq) => productEq.to, {
    eager: true,
  })
  productEq_To: ProductEquivalence;

  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  createBy: User;
  // ****************** automaticas ******************

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;
}
