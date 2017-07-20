module.exports = {
  model: 'respondent_flow',
  data: [
    //user 1 flow SALES , respondido
    {
      id: 1,
      assigner_id: 1,
      respondent_id: 1,    //user (respondent)
      current_step_id: 5,  //pergunta
      flow_id: 1,          //editing sales
      respondent_flow_status_id: 3,
      duration_seconds: 100,
    },
    //user 2 flow SALES a responder
    {
      id: 2,
      assigner_id: 1,
      respondent_id: 2,    //user (respondent)
      current_step_id: 3,  //pergunta
      flow_id: 1,          //editing sales
      respondent_flow_status_id: 3,
      duration_seconds: 352,
    },
    //user 1 flow Marketing  a responder
    {
      id: 3,
      assigner_id: 1,
      respondent_id: 1,    //user (respondent)
      current_step_id: 4,  //pergunta
      flow_id: 2,          //editing sales
      respondent_flow_status_id: 3,
      duration_seconds: 575,
    },
    //user 2 flow Marketing, ainda nao respondeu
    {
      id: 4,
      assigner_id: 1,
      respondent_id: 2,    //user (respondent)
      current_step_id: 1,  //pergunta
      flow_id: 2,          //editing sales
      respondent_flow_status_id: 3,
      duration_seconds: 8500,
    },
  ]
};