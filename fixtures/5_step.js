module.exports = {
  model: 'step',
  data: [
    {
      id: 1,
      stepOrder: 1,
      text: "Welcome to bitmaker! I will ask you some questions. Please provide accurate answers.",
      flowId: 1,
      stepTypeId: 1
    },
    {
      id: 2,
      stepOrder: 4,
      text: "Please provide a brief description about you.",
      flowId: 1,
      stepTypeId: 2
    },
    {
      id: 3,
      stepOrder: 3,
      text: "Please download this document and read it",
      flowId: 1,
      stepTypeId: 3
    },
    {
      id: 4,
      stepOrder: 2,
      text: "How many years of experience do you have",
      flowId: 1,
      stepTypeId: 4
    },
    {
      id: 5,
      stepOrder: 5,
      text: "Please go to x and do y",
      flowId: 1,
      stepTypeId: 5
    },
    {
      id: 6,
      stepOrder: 6,
      text: "Another multiple-choice question",
      flowId: 1,
      stepTypeId: 4
    },
  ]
};