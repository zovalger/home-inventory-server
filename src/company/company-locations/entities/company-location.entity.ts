import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../../auth/entities';
import { File } from '../../../files/entities';
import { Company } from '../../entities';
import { StatusObject } from '../../../common/interfaces';
import { ValidCompanyLocations } from '../interfaces';

@Entity('company_location')
export class CompanyLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false })
  name: string;

  // @Column('text', { nullable: false })
  // rif_prefix: string;

  // @Column('text', { nullable: false })
  // rif_number: string;

  @Column('text')
  address: string;

  @Column('text', { nullable: false, default: ValidCompanyLocations.sede })
  type: ValidCompanyLocations; // sede/sucursal | almacen

  @Column('text', { nullable: false, default: StatusObject.active })
  status: StatusObject;

  @Column('text', { nullable: false })
  companyId: string;

  @Column('text', { nullable: false })
  createById: string;

  @Column('text', { nullable: true })
  imageUrl: string;

  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  createBy: User;

  @ManyToOne(() => Company, (company) => company.id)
  company: Company;

  @ManyToOne(() => File, { cascade: true })
  @JoinColumn({ referencedColumnName: 'url' })
  image?: File;

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;
}
