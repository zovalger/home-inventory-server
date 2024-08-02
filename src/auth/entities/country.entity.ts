import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('country')
export class Country {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text', { nullable: false, unique: true })
  name: string;

  @Column('text', { nullable: false, unique: true })
  code: string;
}
