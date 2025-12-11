const docs = {
  checkInTime: {
    required: true,
    example: '2021-04-29 15:26:26.399888+00',
    description: 'This is check in time of attendance',
  },
  shift: {
    required: true,
    example: 'S1',
    description: 'S1 || S2',
  },
  checkoutTime: {
    required: true,
    example: '2021-04-29 15:26:26.399888+00',
    description: 'This is checkout time of attendance',
  },
  isNightShiftLogin: {
    required: false,
    example: 'true | false',
  },
  locationId: {
    required: true,
    example: [1, 2, 3],
    description: 'This is check in location id',
  },
  deviceId: {
    required: true,
    example: 'abcdeeddasd',
    description: 'This is check in location id',
  },
  rowId: {
    required: true,
    example: 123123,
    description: 'rowId you will receive it against check in.',
  },
  employeeId: {
    required: true,
    example: 1,
    description: 'This is employee detail',
  },
  avatarId: {
    required: true,
    example: 5,
    description: 'avatar of admin',
  },
  checkInId: {
    example: 12345,
    description: 'checkin id of the employee',
  },
  checkoutLocationId: {
    required: true,
    example: [1, 2, 3],
    description: 'This is check out location id',
  },
  isArchived: {
    required: false,
    example: false,
    description: 'status is archived or not',
  },
  checkInFaceId: {
    required: true,
    example: 5,
    description: 'face id of employee',
  },

  checkInType: {
    required: false,
    example: 'face',
    description: 'face id of employee',
  },

  checkOutType: {
    required: false,
    example: 'qrCode',
    description: 'face id of employee',
  },

  checkInFace: {
    required: false,
    example: 'face',
    description: 'face id of employee',
  },

  checkOutFace: {
    required: false,
    example: 'qrCode',
    description: 'face id of employee',
  },

  checkInDeviceId: {
    required: true,
  },

  checkOutDeviceId: {
    required: true,
  },
};
export default docs;
