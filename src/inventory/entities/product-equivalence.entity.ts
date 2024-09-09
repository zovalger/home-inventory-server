import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
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

  @OneToOne(() => Product, (product) => product.productEq_From)
  @JoinColumn()
  from: Product;

  @OneToOne(() => Product, (product) => product.productEq_To)
  @JoinColumn()
  to: Product;

  // ****************** automaticas ******************

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;
}
