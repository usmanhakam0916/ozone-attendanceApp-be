import {
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { File } from '../file/file.entity';
import { User } from '../user/user.entity';
import { Location } from '../location/location.entity';

@Entity()
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, {
    eager: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  authUser: User;

  @OneToOne(() => File, {
    onDelete: 'SET NULL',
    eager: true,
  })
  @JoinColumn()
  avatar: File;

  @OneToMany(() => Location, (locations) => locations.admin)
  locations: Location[];
}
