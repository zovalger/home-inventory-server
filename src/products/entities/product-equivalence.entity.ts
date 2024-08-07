import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Product } from './product.entity';

@Entity('product_equivalence')
export class ProductEquivalence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('float', { default: 1 })
  equal: number;

  // ****************** llaves foraneas ******************

  @Column('text', { nullable: false })
  fromId: string;

  @Column('text', { nullable: false })
  toId: string;

  // ****************** relaciones ******************

  @ManyToOne(() => Product, (product) => product.productEq_From)
  from: Product;

  @ManyToOne(() => Product, (product) => product.productEq_To)
  to: Product;

  // ****************** automaticas ******************

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;
}
