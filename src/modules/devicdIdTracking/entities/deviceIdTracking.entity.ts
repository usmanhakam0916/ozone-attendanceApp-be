import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity, ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from "../../user/user.entity";

@Entity('device_id_tracking')
export class DeviceIdTracking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  deviceId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isArchive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => User, (user) => user.deviceIdTrackingAmendBy, {
    lazy: true,
    onDelete: 'SET NULL',
  })
  amendBy: User;

  @ManyToOne(() => User, (user) => user.deviceIdTracking, {
    lazy: true,
    onDelete: 'SET NULL',
  })
  user: User;
}
