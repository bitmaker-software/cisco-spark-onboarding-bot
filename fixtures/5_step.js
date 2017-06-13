module.exports = {
  model: 'step',
  data: [
    {
      id: 1,
      step_order: 1,
      text: "Welcome to bitmaker! I will ask you some questions. Please provide accurate answers.",
      flow_id: 1,
      step_type_id: 1
    },
    {
      id: 2,
      step_order: 2,
      text: "Please provide a brief description about you.",
      flow_id: 1,
      step_type_id: 2
    },
    {
      id: 3,
      step_order: 3,
      text: "Please download this document and read it",
      flow_id: 1,
      step_type_id: 3
    },
    {
      id: 4,
      step_order: 4,
      text: "How many years of experience do you have",
      flow_id: 1,
      step_type_id: 4
    },
    {
      id: 5,
      step_order: 5,
      text: "Another multiple-choice question",
      flow_id: 1,
      step_type_id: 4
    },
  ]
};