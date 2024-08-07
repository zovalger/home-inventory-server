import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { User } from 'src/auth/entities';
import { ProductTransactionType } from '../interfaces';

@Entity('product_transaction')
export class ProductTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false })
  productid: string;

  @Column('text', { nullable: false, default: ProductTransactionType.add })
  type: ProductTransactionType; // add, subtract, unpacking

  @Column('float', { nullable: false, default: 1 })
  quantity: number;

  @Column('float')
  remainder: number;

  @Column('date', { nullable: true })
  expirationDate: string;

  @Column('text', { nullable: true })
  transactionToSustractId: string;

  // ****************** relaciones ******************

  @ManyToOne(() => Product, (product) => product.transactions)
  product: Product;

  @ManyToOne(() => ProductTransaction)
  transactionToSustract: ProductTransaction;

  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  createBy: User;

  // ****************** automaticas ******************

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;
}
