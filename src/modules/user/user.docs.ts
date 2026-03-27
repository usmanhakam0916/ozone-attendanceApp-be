const docs = {
  email: {
    required: true,
    example: 'admin@admin.com',
    description: 'Employee email',
  },
  UserType: {
    required: true,
    example: 'admin',
    description: 'This is the type of user',
  },
  status: {
    required: true,
    example: 'Active',
    description: 'This is the status of user',
  },
  username: {
    required: true,
    example: 'admin',
    description: 'Unique username',
  },
  password: {
    required: true,
    example: 'admin',
    description: 'This is password of user',
  },
  deviceId: {
    required: false,
    example: '1243',
  },
  multiDevice: {
    required: false,
    example: true || false,
    description: 'if true not check deviceId ',
  },
  deviceType: {
    required: false,
    example: 'android || iphone',
  },
  qrCodeCheckInAllowed: {
    required: true,
  },
  faceCheckInAllowed: {
    required: true,
  },
  initialData: {
    required: false,
    example: `{"Employee No":15622,"Name":"Sohail Mohammad Yaqoob Jamal","Position":"RESIDENT GENERAL SURGERY","Department":"General Medicine","Branch":"Khobar","Role":"","Mac Address":"NA","Location Type":"Multi-Location","Assigned Location":"Khobar - Building A Main Entrance, Khobar - Building B Main Entrance, Khobar - Tower 1 Staff Entrance, Khobar - OPD Main Entrance","HOD":"Elbert Kay Tizon  Serrano","Early Check-In Allowed":"Yes","Status":"Active"}`,
    description: 'Stringify json of Initial personal data of an employee.',
  },
  Name: {
    required: true,
    example: 'House keeping',
    description: 'Name of house keeping staff',
  },

  Id: {
    required: true,
    example: 'R046',
    description: 'Id of house keeping staf in their companies',
  },

  Branch: {
    required: true,
    example: 'Khobar',
    description: 'Branch of house keeping staff',
  },

  Company: {
    required: true,
    example: 'Riada',
    description: 'Name of house keeping staff company',
  },
};
export default docs;
