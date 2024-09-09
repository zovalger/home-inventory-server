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

import { User } from '../../auth/entities';
import { File } from '../../files/entities';
import { StatusObject } from 'src/common/interfaces';
import { Product } from 'src/inventory/entities';

@Entity('company')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false })
  name: string;

  @Column('text', { nullable: false })
  rif_prefix: string;

  @Column('text', { nullable: false })
  rif_number: string;

  @Column('text', { nullable: false })
  address: string;

  @Column('text', { nullable: false, default: StatusObject.active })
  status: StatusObject;

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;

  // ****************** relaciones ******************

  @Column('text', { nullable: false })
  createById: string;
  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  createBy: User;

  @OneToMany(() => Product, (product) => product.companyId)
  products: Product[];

  @Column('text', { nullable: true })
  imageUrl: string;
  @ManyToOne(() => File, { cascade: true })
  @JoinColumn({ referencedColumnName: 'url' })
  image?: File;
}
