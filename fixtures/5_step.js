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
      text: "Upload an important document.",
      flow_id: 1,
      step_type_id: 4
    },
    {
      id: 3,
      step_order: 3,
      text: "Please provide a brief description about you.",
      flow_id: 1,
      step_type_id: 2
    },
    {
      id: 4,
      step_order: 4,
      text: "Please download this document and read it",
      flow_id: 1,
      step_type_id: 5
    },
    {
      id: 5,
      step_order: 5,
      text: "How many years of experience do you have",
      flow_id: 1,
      step_type_id: 3
    },
    {
      id: 6,
      step_order: 6,
      text: "Another multiple-choice question",
      flow_id: 1,
      step_type_id: 3
    },
  ]
};