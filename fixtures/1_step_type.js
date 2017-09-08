module.exports = {
  model: 'step_type',
  data: [
    {
      id: 1,
      name: 'Announcement Message',
      description: 'No response from the user to move the next step'
    },
    {
      id: 2,
      name: 'Question Step',
      description: 'Owner must enter a question and the confirmation word that the user must enter to move on in the Flow'
    },
    {
      id: 3,
      name: 'Multiple Choice Step',
      description: 'Owner specifies a list of possible options, end user replies with 1,2,3 or 4 etc'
    },
    {
      id: 4,
      name: 'Upload Document Step',
      description: 'Owner specifies some instructions and the end user must upload a document to complete the step'
    },
    {
      id: 5,
      name: 'Read Document Step',
      description: 'Owner must upload a document and the end user must read it'
    },
    // {
    //   id: 6,
    //   name: 'Read & Upload Document Step',
    //   description: 'Owner upload a document and the end user must read it and upload a new one to complete the step'
    // },
    {
      id: 7,
      name: 'People to meet',
      description: 'A Spark room would be created between the person being onboarded and the people specified'
    },

  ]
};