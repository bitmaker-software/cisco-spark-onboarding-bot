module.exports = {
  model: 'step_type',
  data: [
  {
    id: 1,
    description: 'Announcement Message (no response from the user to move the next step)'
  },
  {
    id: 2,
    description: 'Question Step (owner must enter a question and the confirmation word that the user must enter to move on in the Flow)'
  },
  {
    id: 3,
    description: 'Document Step (owner specifies some instructions and the end user must upload a document to complete the step)'
  },
  {
    id: 4,
    description: 'Multiple Choice Step (owner specifies a list of possible options, end user replies with 1,2,3 or 4 etc)'
  },
  {
    id: 5,
    description: 'Docusign Step (owner specifies a document which will trigger a document to be sent to Docusign for the end user to digitally sign)'
  }
]};