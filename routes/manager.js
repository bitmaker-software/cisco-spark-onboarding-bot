"use strict";

const models = require('../models');
const router = require('express').Router();
const ensureAuthenticated = require('./auth_middleware');
const databaseServices = require('../bot/database_services');
const sparkAPIUtils = require('../bot/spark_api_utils');

//aqui
let env = require('node-env-file');
env(__dirname + '/../bot/.env');

let gdrive_client_id = process.env.gdrive_client_id;
let gdrive_developer_key = process.env.gdrive_developer_key;
let gdrive_share_to = 'spark-drive@testdriveintegration-167213.iam.gserviceaccount.com';

//let bot = require('../app').bot;

if (!gdrive_client_id) {
  console.error("WARNING: gdrive_client_id is not defined!");
}
if (!gdrive_developer_key) {
  console.error("WARNING: gdrive_developer_key is not defined!");
}
if (!gdrive_share_to) {
  console.error("WARNING: gdrive_share_to is not defined!");
}


// ——————————————————————————————————————————————————
//                  View All Flows
// ——————————————————————————————————————————————————

router.get('/', ensureAuthenticated, function (req, res, next) {
  getFlows().then(flows => {
    res.render('manager_flows', {
      title: 'Onboarding manager',
      flows: flows,
      active: 'Manager' // left side bar icon
    });
    console.log('........');
    console.log(flows);
  }, err => {
    console.error("Error fetching the flows:");
    console.error(err);
  });
});


// ——————————————————————————————————————————————————
//                     View Flow
// ——————————————————————————————————————————————————

router.get('/api/flow/:id', ensureAuthenticated, function (req, res, next) {
  // Returns the flow steps
  const SEND_DUMMY = false;

  if (!SEND_DUMMY) {
    // TODO filter the user; add attributes [] to filter columns
    models.step.findAll({
      where: {flow_id: req.params.id},
      include: [
        {model: models.step_choice}
      ],
      order: [[models.Sequelize.col('"step_order"'), 'ASC'],
        [models.step_choice, '"choice_order"', 'ASC']],
    }).then(steps => {
      return res.send({
        flowId: req.params.id,
        steps: steps
      });
    }, err => {
      console.error("Error fetching the flow steps:");
      console.error(err);
    });
  } else {
    // Dummy data
    return res.send({
      flowId: req.params.id,
      steps: [
        {id: '0', step_order: '1', text: 'Step number one', step_type: 0},
        {id: '1', step_order: '2', text: 'Step number two', step_type: 1},
        {id: '2', step_order: '3', text: 'Step number three', step_type: 0},
        {id: '3', step_order: '4', text: 'Step number four', step_type: 2},
        {id: '4', step_order: '5', text: 'Step number five', step_type: 1},
        {id: '5', step_order: '6', text: 'Step number six', step_type: 3},
        {id: '6', step_order: '7', text: 'Step number seven', step_type: 4}
      ]
    });
  }
});


// ——————————————————————————————————————————————————
//                     New Flow
// ——————————————————————————————————————————————————

router.post('/api/flow', ensureAuthenticated, function (req, res, next) {
  // New flow
  console.log("Got a request to create a new flow");
  console.log(req.body);
  models.flow.create({
    name: req.body.name,
    flow_status_id: 1
  }).then(function () {
    return res.send('OK, saved flow');
  }, err => {
    console.error("Error creating the flow");
    console.error(err);
  });
});


// ——————————————————————————————————————————————————
//                     Edit Flow
// ——————————————————————————————————————————————————

router.get('/flow/:id/edit', ensureAuthenticated, function (req, res, next) {
  let promises = [
    getStepTypes(),
    getFlow(req.params.id)
  ];
  Promise.all(promises).then(values => {
    res.render('manager_flow_edit', {
      title: values[1][0].name,
      flowId: req.params.id,
      stepTypes: values[0],
      active: 'Manager', // left side bar icon
      gdrive_client_id: gdrive_client_id,
      gdrive_developer_key: gdrive_developer_key,
      gdrive_share_to: gdrive_share_to
    });
  }, err => {
    console.error("Error fetching the step types or flow:");
    console.error(err);
  });
});

router.put('/api/flow', ensureAuthenticated, function (req, res, next) {
  console.log('————————————————————————————————————————————————————————————————————————————————————————————————————');
  console.log('Update flow, got:');
  console.log(req.body);
  console.log('————————————————————————————————————————————————————————————————————————————————————————————————————');
  // TODO check this steps belongs to this flow and this flow belongs to the user requesting this !!!!!!!!!!
  // TODO handle multiple db queries and send response only when finished!

  let promiseArray = [];

  req.body.steps.forEach((step, index) => {
    if (step.id === undefined) {
      // Create step
      promiseArray.push(
        models.step
          .create(
            {
              text: step.text,
              step_order: index + 1,
              flow_id: req.body.flow_id,
              step_type_id: step.step_type_id,
            }
          )
          .then(result => {
            console.log("Result from new step");
            console.log(result);

            if (step.step_type_id === 3) {
              // Multiple choice
              console.log("step.step_choices:");
              console.log(step.step_choices);
              step.step_choices.forEach((choice, index) => {
                console.log("Step index: " + index);
                models.step_choice.create(
                  {
                    text: choice.text,
                    choice_order: index + 1,
                    step_id: result.id, // the new step id
                  }
                ).then(result => {
                  //
                }, err => {
                  console.error("Error saving the step choice:");
                  console.error(err);
                  return res.send(err);
                });
              });
            } // if step type === 4

            if (step.step_type_id === 5 || step.step_type_id === 6) {
              //read documents
              console.log("step.document_steps:");
              console.log(step.document_steps);

              step.document_steps.forEach((document, index) => {
                  console.log("Document index: " + index);
                  models.document_step.create({
                    //document_store_id: ,
                    document_url: document,
                    step_id: step.id,
                    //upload_dir: ,
                  }).then(result => {
                        //
                  }, err => {
                    console.error("Error saving the document step:");
                    console.error(err);
                    return res.send(err);
                  });
              });
            }

          })
      )
    } else {
      // Update step
      promiseArray.push(
        models.step
          .update(
            {
              text: step.text,
              step_order: index + 1,
            }, {where: {id: step.id}}
          )
          .then(result => {
            let affectedCount = result[0];
            // let affectedRows = result[1]; // only supported in postgres with options.returning = true

            console.log("Result from updated step");
            console.log(affectedCount);
            // console.log(affectedRows);

            if (affectedCount === 1) {
              // Check if is multiple choice
              console.log("Step updated (type = " + step.step_type_id + ")");
              if (step.step_type_id === 4) {
                // Multiple choice
                // TODO: what if the user removed options? etc.
                step.step_choices.forEach((choice, index) => {
                  console.log("Choice index: " + index);
                  if (choice.id === undefined) {
                    // Create choice
                    models.step_choice.create(
                      {
                        text: choice.text,
                        choice_order: index + 1,
                        step_id: step.id,
                      }
                    ).then(result => {
                      //
                    }, err => {
                      console.error("Error saving the step choice:");
                      console.error(err);
                      return res.send(err);
                    });
                  } else {
                    // Update choice
                    models.step_choice.update({
                        text: choice.text,
                        choice_order: index + 1,
                      }, {where: {id: choice.id}}
                    ).then(result => {
                      //
                    }, err => {
                      console.error("Error saving the step choice:");
                      console.error(err);
                      return res.send(err);
                    });
                  }
                });
              }
            }
          })
      )
    }
  });

  models.Sequelize.Promise
    .each(
      promiseArray, function (result, index) {
        console.log("Processed step:");
        console.log(result);
        console.log(index);
        console.log('—————');
        // console.log(result[1]);
      })
    .then(function () {
      console.log("All steps processed.");
      return res.status(200).send();


      // console.error("Error saving the step:");
      // console.error(err);
      // return res.send(err);

    });
});

// ——————————————————————————————————————————————————
//                    Send Flow
// ——————————————————————————————————————————————————

router.get('/flow/:id/send', ensureAuthenticated, function (req, res, next) {
  let promises = [
    getStepTypes(),
    getFlow(req.params.id)
  ];
  Promise.all(promises).then(values => {
    res.render('manager_flow_send', {
      title: values[1][0].name,
      flowId: req.params.id,
      stepTypes: values[0],
      active: 'Manager' // left side bar icon
    });
  }, err => {
    console.error("Error fetching the step types or flow:");
    console.error(err);
  });
});

router.get('/api/search_users/:user', ensureAuthenticated, (req, res, next) => {
  sparkAPIUtils.getUserFromSpark({user: req.params.user}, req.user.spark_token).then(users => {
    res.send(users);
  });
});

router.post('/api/flow/:id/send', ensureAuthenticated, (req, res, next) => {
  // Initiate the flow for this user
  const userId = req.body.userId;
  const assignerId = req.user.id;
  const flowId = req.params.id;
  const assignDate = new Date();

  if (!userId) {
    return res.status(400).send("No user ID provided!");
  }

  databaseServices.findOrCreateRespondent(userId, req.user.spark_token).then(user => {
    databaseServices.getFlow(flowId).then(flow => {
      if (!flow.steps.length) {
        return res.status(400).send('The flow has no steps.');
      }
      // Continue
      databaseServices.findOrCreateRespondentFlow(assignerId, user.id, flowId, assignDate).then(respondentFlow => {
        // OK
        sparkAPIUtils.initiateFlowForUser(flowId, user.spark_id);
        return res.status(200).send();
      }, error => {
        // findOrCreateRespondentFlow error
        return res.status(400).send(error);
      });
    }, error => {
      // getFlow error
      return res.status(400).send(error);
    });
  }, error => {
    // findOrCreateRespondent error
    // TODO: can't we catch just one of these errors?
    return res.status(400).send(error);
  });
});


// ——————————————————————————————————————————————————
//                   Flow Answers
// ——————————————————————————————————————————————————

router.get('/flow/:id/answers', ensureAuthenticated, function (req, res, next) {
  let promises = [
    getStepTypes(),
    getFlow(req.params.id),
    databaseServices.countAnswers(req.params.id, "")
  ];
  Promise.all(promises).then(values => {
    res.render('manager_flow_answers', {
      title: values[1][0].name,
      flowId: req.params.id,
      stepTypes: values[0],
      active: 'Manager', // left side bar icon
      totalAnswers: values[2]
    });
  }, err => {
    console.error("Error fetching the step types, flow or answers:");
    console.error(err);
  });
});


// ——————————————————————————————————————————————————
//                   Flow Dashboard
// ——————————————————————————————————————————————————

router.get('/flow/:id/dashboard', ensureAuthenticated, function (req, res, next) {
  let promises = [
    getStepTypes(),
    getFlow(req.params.id)
  ];
  Promise.all(promises).then(values => {
    res.render('manager_flow_dashboard', {
      title: values[1][0].name,
      flowId: req.params.id,
      stepTypes: values[0],
      active: 'Manager' // left side bar icon
    });
  }, err => {
    console.error("Error fetching the step types or flow:");
    console.error(err);
  });
});


function getFlows(id) {
  console.log('getFlows(' + id + ')');
  // Returns flows for the logged in tenant
  let config = {
    attributes: ['id', 'name'],
    where: {
      // TODO filter by logged in user !!!
      //   ownerId: 1
    },
    include: [
      {model: models.flow_status, attributes: ['description']}
    ],
  };
  if (id) {
    config.where.id = id;
  }
  return models.flow.findAll(config);
}

function getFlow(id) {
  return getFlows(id);
}

function getStepTypes() {
  return models.step_type.findAll({order: 'id'});
}

module.exports = router;