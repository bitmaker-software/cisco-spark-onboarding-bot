module.exports = {
    model: 'respondent_flow',
    data: [
        //user 1 flow SALES pergunta 1
        {
            id: 1,
            assigner_id:1,
            respondent_id:1,    //user (respondent)
            current_step_id:2,  //pergunta
            flow_id:1,          //editing sales
            flow_status_id:1,
        },
        //user 1 flow SALES pergunta 2
        {
            id: 2,
            assigner_id:1,
            respondent_id:1,    //user (respondent)
            current_step_id:4,  //pergunta
            flow_id:1,          //editing sales
            flow_status_id:1,
        },
        //user 1 flow SALES pergunta 3
        {
            id: 3,
            assigner_id:1,
            respondent_id:1,    //user (respondent)
            current_step_id:5,  //pergunta
            flow_id:1,          //editing sales
            flow_status_id:1,
        },
        //user 2 flow SALES pergunta 1
        {
            id: 4,
            assigner_id:1,
            respondent_id:2,    //user (respondent)
            current_step_id:2,  //pergunta
            flow_id:1,          //editing sales
            flow_status_id:1,
        },
        //user 2 flow SALES pergunta 2
        {
            id: 5,
            assigner_id:1,
            respondent_id:2,    //user (respondent)
            current_step_id:4,  //pergunta
            flow_id:1,          //editing sales
            flow_status_id:1,
        },
    ]
};