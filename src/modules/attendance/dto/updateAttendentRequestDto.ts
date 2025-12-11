import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsString, Max, Min } from "class-validator";
import docs from "../attendance.docs";
import { UpdateRequestStatus } from "../attendance.entity";

export class UpdateAttendentRequestDto {
    @ApiProperty(docs.updateAttendenceTimeDtoAttendanceId)
    @IsNumber()
    attendanceId: number;

    @ApiProperty(docs.updateAttendenceTimeDtoStatus)
    @IsEnum(UpdateRequestStatus)
    status: UpdateRequestStatus;
}
