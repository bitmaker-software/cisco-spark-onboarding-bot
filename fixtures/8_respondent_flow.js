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
      {
          id: 5,
          assigner_id: 1,
          respondent_id: 3,    //user (respondent)
          current_step_id: 1,
          flow_id: 1,
          respondent_flow_status_id: 1,
          duration_seconds: null,
      },
      {
          id: 6,
          assigner_id: 1,
          respondent_id: 4,    //user (respondent)
          current_step_id: 1,
          flow_id: 1,
          respondent_flow_status_id: 1,
          duration_seconds: null,
      },
      {
          id: 7,
          assigner_id: 1,
          respondent_id: 5,    //user (respondent)
          current_step_id: 1,
          flow_id: 1,
          respondent_flow_status_id: 1,
          duration_seconds: null,
      },
      {
          id: 8,
          assigner_id: 1,
          respondent_id: 6,    //user (respondent)
          current_step_id: 1,
          flow_id: 1,
          respondent_flow_status_id: 1,
          duration_seconds: null,
      },{
          id: 9,
          assigner_id: 1,
          respondent_id: 7,    //user (respondent)
          current_step_id: 1,
          flow_id: 1,
          respondent_flow_status_id: 1,
          duration_seconds: null,
      },{
          id: 10,
          assigner_id: 1,
          respondent_id: 8,    //user (respondent)
          current_step_id: 1,
          flow_id: 1,
          respondent_flow_status_id: 1,
          duration_seconds: null,
      },{
          id: 11,
          assigner_id: 1,
          respondent_id: 9,    //user (respondent)
          current_step_id: 1,
          flow_id: 1,
          respondent_flow_status_id: 1,
          duration_seconds: null,
      },{
          id: 12,
          assigner_id: 1,
          respondent_id: 10,    //user (respondent)
          current_step_id: 1,
          flow_id: 1,
          respondent_flow_status_id: 1,
          duration_seconds: null,
      },{
          id: 13,
          assigner_id: 1,
          respondent_id: 11,    //user (respondent)
          current_step_id: 1,
          flow_id: 1,
          respondent_flow_status_id: 1,
          duration_seconds: null,
      },
  ]
};