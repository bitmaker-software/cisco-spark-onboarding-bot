module.exports = {
    model: 'respondent_answer',
    data: [
        //user 1 flow SALES pergunta 1
        {
            id: 1,
            status: 'Answered',     //Answered || Waiting
            question_date: null,
            answer_date: new Date(),
            text: 'This is me.',
            document_url: null,
            step_choice_id: null,
            respondent_flow_id: 1,  //daqui vou buscar o user e o flow (tmb devia ir buscar a pergunta...)
            step_id: 2,
        },
        //user 1 flow SALES pergunta 2
        {
            id: 2,
            status: 'Answered',
            question_date: null,
            answer_date: new Date(),
            text: null,
            document_url: null,
            step_choice_id: 1,
            respondent_flow_id: 2,
            step_id: 4,
        },
        //user 1 flow SALES pergunta 3
        {
            id: 3,
            status: 'Answered',
            question_date: null,
            answer_date: new Date(),
            text: null,
            document_url: null,
            step_choice_id: 6,
            respondent_flow_id: 3,
            step_id: 5,
        },
        //user 2 flow SALES pergunta 1
        {
            id: 4,
            status: 'Answered',
            question_date: null,
            answer_date: new Date(),
            text: 'This is the other me.',
            document_url: null,
            step_choice_id: null,
            respondent_flow_id: 4,
            step_id: 2,
        },
        //user 2 flow SALES pergunta 2
        {
            id: 5,
            status: 'Waiting',
            question_date: null,
            answer_date: new Date(),
            text: null,
            document_url: null,
            step_choice_id: null,
            respondent_flow_id: 5,
            step_id: 4,
        }
    ]
};