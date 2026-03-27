const docs = {
  checkInRowId: {
    required: true,
    example: '1q2w3e',
    description: 'This is check in row id of employee',
  },

  attendanceType: {
    required: true,
    example: 'Multiple',
    description: 'This is attendance type of employee',
  },

  locations: {
    required: true,
    example: [1, 2, 3],
    description: '',
  },
  attendanceRadius: {
    required: true,
    example: 100,
    description: 'This is attendance radius of employee default value is 100',
  },
  faceId: {
    required: true,
    example: 1,
    description: 'This is file id of face id of employee',
  },
  employeeId: {
    required: true,
    example: 1,
    description: 'This is employeeId',
  },
  locationId: {
    required: true,
    example: 1,
    description: 'This is location id',
  },
  fileId: {
    required: true,
    example: 1,
    description: 'This is file id',
  },
  otp: {
    required: true,
    example: '1234',
    description: 'This is otp',
  },
  password: {
    required: false,
    example: 'abc!@#',
    description: 'This is a password',
  },
  macAddress: { required: true, example: 'abcdes' },

  isMac: { required: true, example: false },

  groupId: { required: false, example: 1 },

  multiDevice: { required: false, example: false || true },

  userName: {
    required: true,
    example: 'admin',
    description: 'Unique username',
  },

  firstName: {
    required: true,
    example: 'first',
    description: 'Employee name',
  },

  lastName: {
    required: true,
    example: 'last',
    description: 'Employee name',
  },

  email: {
    required: true,
    example: 'admin@admin.com',
    description: 'Employee email',
  },

  deviceId: {
    required: true,
    example: 'abcdeeddasd',
    description: 'This is check in location id',
  }
};
export default docs;
