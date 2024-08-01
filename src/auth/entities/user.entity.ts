import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false })
  name: string;

  @Column('text', { nullable: true })
  lastName: string;

  @Column('text', { nullable: false, unique: true })
  email: string;

  @Column('text', { nullable: false, select: false })
  password: string;

  @Column('int', { nullable: false })
  age: number;

  // country: string;
  // image: string;

  @Column('bool', { default: true, nullable: false })
  isActive: boolean;

  @Column('bool', { default: false, nullable: false })
  isVerified: boolean;

  @Column('text', { array: true, default: ['user'] })
  roles: string[];

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;

  @BeforeInsert()
  lowerCaseEmail() {
    this.email = this.email.toLocaleLowerCase();
  }
}
