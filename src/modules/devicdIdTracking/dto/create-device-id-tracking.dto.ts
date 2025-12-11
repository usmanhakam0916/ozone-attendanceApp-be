import { ApiProperty } from "@nestjs/swagger";

export class CreateDeviceIdTrackingDto {
    @ApiProperty()
    deviceId: string;

    @ApiProperty()
    amendForId: number;

    @ApiProperty()
    amendById: number
}
