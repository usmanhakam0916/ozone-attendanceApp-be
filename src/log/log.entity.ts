import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: null })
  type: string;

  @Column({ default: null })
  requestPayload: string;

  @Column({ default: null })
  response: string;

  @Column({ default: null })
  attendanceId: number;

  @Column({ default: null })
  employeeId: number;

  @Column({ default: null })
  createdAt: string;
}
