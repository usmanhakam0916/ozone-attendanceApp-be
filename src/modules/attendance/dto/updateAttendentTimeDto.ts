import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsString, Max, Min } from "class-validator";
import docs from "../attendance.docs";


export enum AttendenceTimeType {
    CHECKIN = 'CHECKIN',
    CHECKOUT = 'CHECKOUT'
}

export class UpdateAttendenceTimeDto {
    @ApiProperty(docs.updateAttendenceTimeDtoAttendanceId)
    @IsNumber()
    attendanceId: number;

    @ApiProperty(docs.attendenceTimeType)
    @IsEnum(AttendenceTimeType)
    attendenceTimeType: AttendenceTimeType;

    @ApiProperty(docs.attendenceTimeHour)
    @IsNumber()
    @Min(0)
    @Max(23)
    hour: number;

    @ApiProperty(docs.attendenceTimeMinute)
    @IsNumber()
    @Min(0)
    @Max(59)
    minute: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    comment: string;
}
