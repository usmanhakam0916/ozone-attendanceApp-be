import { ApiProperty, IntersectionType, OmitType } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";
import { UpdateAttendenceTimeDto } from "./updateAttendentTimeDto";

export class UpdateAttendentRequestDto extends OmitType(UpdateAttendenceTimeDto, ['comment'] as const) {
    @ApiProperty()
    @IsBoolean()
    approved: boolean;
}
