const docs = {
  name: {
    required: true,
    example: 'Johar Town',
    description: 'name of location',
  },

  qrCode: {
    required: true,
    example: 'qwertyuioplkmnbhvcxs2345678ikmnbvc',
    description: 'Unique QR code of the location',
  },

  lat: {
    required: true,
    example: 22,
    description: 'latitude of location',
  },
  long: {
    required: true,
    example: 23,
    description: 'longitude of location',
  },
  currentTime: {
    required: true,
    example: '10-1-1',
    description: 'Current Date and time',
  },
};
export default docs;
