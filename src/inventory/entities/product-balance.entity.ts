import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { CompanyLocation } from '../../company-locations/entities';

@Entity('product_balance')
export class ProductBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false })
  productId: string;

  @ManyToOne(() => Product, (product) => product.id)
  @JoinColumn()
  product: Product;

  @Column('text', { nullable: false })
  companyLocationId: string;

  @ManyToOne(() => CompanyLocation, (companyLocation) => companyLocation.id)
  @JoinColumn()
  companyLocation: CompanyLocation;

  @Column('float', { nullable: false, default: 0 })
  quantity: number;

  @Column('float', { nullable: false, default: 0 })
  relativeQuantity: number;

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;
}
