module.exports = {
  model: 'respondent_answer',
  data: [
    //user 1 flow SALES pergunta 1
    {
      id: 1,
      answer_status_id: 2,     //Answered || Waiting
      question_date: null,
      answer_date: new Date(),
      text: 'I\'m André from Bitmaker',
      document_url: null,
      step_choice_id: null,
      respondent_flow_id: 1,  //daqui vou buscar o user e o flow
      step_id: 3,
    },
    //user 1 flow SALES pergunta 2
    {
      id: 2,
      answer_status_id: 2,
      question_date: null,
      answer_date: new Date(),
      text: null,
      document_url: null,
      step_choice_id: 1,
      respondent_flow_id: 2,
      step_id: 5,
    },
    //user 1 flow SALES pergunta 3
    {
      id: 3,
      answer_status_id: 2,
      question_date: null,
      answer_date: new Date(),
      text: null,
      document_url: null,
      step_choice_id: 6,
      respondent_flow_id: 3,
      step_id: 6,
    },
    //user 2 flow SALES pergunta 1
    {
      id: 4,
      answer_status_id: 2,
      question_date: null,
      answer_date: new Date(),
      text: 'I\'m Inês from Bitmaker',
      document_url: null,
      step_choice_id: null,
      respondent_flow_id: 4,
      step_id: 3,
    },
    //user 2 flow SALES pergunta 2
    {
      id: 5,
      answer_status_id: 1,
      question_date: null,
      answer_date: new Date(),
      text: null,
      document_url: null,
      step_choice_id: null,
      respondent_flow_id: 5,
      step_id: 5,
    }
  ]
};