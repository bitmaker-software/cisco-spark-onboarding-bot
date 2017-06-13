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
    name: 'Document Step',
    description: 'Owner specifies some instructions and the end user must upload a document to complete the step'
  },
  {
    id: 4,
    name: 'Multiple Choice Step',
    description: 'Owner specifies a list of possible options, end user replies with 1,2,3 or 4 etc'
  },
]};