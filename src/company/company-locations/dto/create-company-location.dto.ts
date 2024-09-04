import { ValidCompanyLocations } from '../interfaces';

export class CreateCompanyLocationDto {
  name: string;

  // @Column('text', { nullable: false })
  // rif_prefix: string;

  // @Column('text', { nullable: false })
  // rif_number: string;

  address: string;

  type: ValidCompanyLocations; // sede/sucursal | almacen

  companyId: string;

  // @Column('text', { nullable: true })
  // imageUrl: string;
}
