const docs = {
  name: {
    required: true,
    example: 'Policy Name',
    description: 'Group Policy Name',
  },

  checkinTime: {
    required: true,
    example: 'link',
    description: 'link',
  },

  checkoutTime: {
    required: true,
    example: 22,
    description: 'employeeNumber',
  },

  tags: {
    required: false,
    example: 'main,new',
    description: 'Tags added by admin to any group',
  },

  employees: {
    required: false,
    example: [1, 2, 3, 4],
    description: 'Employess where group is assigned, Not Required',
  },
};
export default docs;
