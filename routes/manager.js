"use strict";

const models = require('../models');
const router = require('express').Router();
const ensureAuthenticated = require('./auth_middleware');
const databaseServices = require('../bot/database_services');
const sparkAPIUtils = require('../bot/spark_api_utils');
const googleDriveConfig = require('../bot/keys/Integration test-6661fdb0c0a7.json');

const STATUS_TYPES = require('../bot/status_types');

//aqui
let env = require('node-env-file');
env(__dirname + '/../bot/.env');

const gdrive_client_id = process.env.gdrive_client_id;
const gdrive_developer_key = process.env.gdrive_developer_key;
const gdrive_share_to = googleDriveConfig.client_email;

//let bot = require('../app').bot;

if (!gdrive_client_id) {
  console.error(`WARNING: gdrive_client_id is not defined!`);
}
if (!gdrive_developer_key) {
  console.error(`WARNING: gdrive_developer_key is not defined!`);
}
if (!gdrive_share_to) {
  console.error(`WARNING: gdrive_share_to is not defined!`);
}


// ——————————————————————————————————————————————————
//                  View All Flows
// ——————————————————————————————————————————————————

router.get('/', ensureAuthenticated, function (req, res, next) {
  databaseServices.getFlows().then(flows => {
    res.render('manager_flows', {
      title: 'Onboarding manager',
      flows: flows,
      active: 'Manager' // left side bar icon
    });
    console.log(`........`);
    console.log(flows);
  }, err => {
    console.error(`Error fetching the flows:`);
    console.error(err);
  });
});


// ——————————————————————————————————————————————————
//                     View Flow
// ——————————————————————————————————————————————————

router.get('/api/flow/:id', ensureAuthenticated, function (req, res, next) {
  /**
   Used to show the steps at the edit flow page
   */
  // TODO: filter by user, do not allow accessing other users flows
  databaseServices.getFlowSteps(req.params.id).then(steps => {
    return res.send({
      flowId: req.params.id,
      steps: steps
    });
  }, err => {
    console.error(`Error fetching the flow steps:`);
    console.error(err);
  });
});


// ——————————————————————————————————————————————————
//                     New Flow
// ——————————————————————————————————————————————————

router.post('/api/flow', ensureAuthenticated, (req, res, next) => {
  // New flow
  console.log(`Got a request to create a new flow`);
  console.log(req.body);
  databaseServices.createFlow(req.body.name).then(() => {
    return res.send(`OK, saved flow`);
  }, err => {
    console.error(`Error creating the flow`);
    console.error(err);
  });
});


// ——————————————————————————————————————————————————
//                     Edit Flow
// ——————————————————————————————————————————————————

router.get('/flow/:id/edit', ensureAuthenticated, function (req, res, next) {
  let promises = [
    databaseServices.getStepTypes(),
    databaseServices.getFlow(req.params.id)
  ];
  Promise.all(promises).then(values => {
    res.render('manager_flow_edit', {
      title: values[1].name,
      flowId: req.params.id,
      stepTypes: values[0],
      active: 'Manager', // left side bar icon
      gdrive_client_id: gdrive_client_id,
      gdrive_developer_key: gdrive_developer_key,
      gdrive_share_to: gdrive_share_to
    });
  }, err => {
    console.error(`Error fetching the step types or flow:`);
    console.error(err);
  });
});

router.delete('/api/delete_step/:step_id', (req, res, next) => {

  let step_id = req.params.step_id;

  models.step.findById(step_id).then(step => {
    step.destroy();
  });
});

router.delete('/api/delete_step_choice/:step_id/:step_choice_id', (req, res, next) => {

    let step_id = req.params.step_id;
    let step_choice_id = req.params.step_choice_id;

    console.log(step_id+" - "+step_choice_id)

    models.step.findById(step_id).then(step => {
      //escolha multipla
      if(step.step_type_id == 3){
        models.step_choice.findById(step_choice_id).then(step_choice => {
          step_choice.destroy();
        });
      }else{
        res.sendStatus(401);
      }
    });
});

router.put('/api/flow', ensureAuthenticated, function (req, res, next) {
  console.log(`————————————————————————————————————————————————————————————————————————————————————————————————————`);
  console.log(`Update flow, got:`);
  console.log(req.body);
  console.log(`————————————————————————————————————————————————————————————————————————————————————————————————————`);
  // TODO check this steps belongs to this flow and this flow belongs to the user requesting this !!!!!!!!!!
  // TODO handle multiple db queries and send response only when finished!

  let promiseArray = [];

  req.body.steps.forEach((step, index) => {

    if (step.id === undefined) {
      // Create step
      promiseArray.push(
        databaseServices.createStep(
          step.text,
          index + 1,
          req.body.flow_id,
          step.step_type_id
        ).then(newStep => {
          console.log(`Result from new step`);
          console.log(newStep);

          if (step.step_type_id === STATUS_TYPES.STEP_TYPES.MULTIPLE_CHOICE) {
            console.log(`step.step_choices:`);
            console.log(step.step_choices);
            step.step_choices.forEach((choice, index) => {
              console.log(`Step index: ${index}`);
              databaseServices.createStepChoice(
                choice.text,
                index + 1,
                newStep.id
              ).then(newStepChoice => {
                // Done
                console.log(`Created choice step`);
              }, err => {
                console.error(`Error saving the step choice:`);
                console.error(err);
                return res.send(err); // TODO: calling return from inside the callback function?!
              });
            });
          } else if (step.step_type_id === STATUS_TYPES.STEP_TYPES.UPLOAD_TO_BOT ||
            step.step_type_id === STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT ||
            step.step_type_id === STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK) {
            // Upload documents
            console.log(`step.upload_id: ${step.upload_id}`);
            console.log(`step.document_id: ${step.document_id}`);
            console.log(`step.document_name: ${step.document_name}`);
            console.log(`step.upload_dir_name: ${step.upload_dir_name}`);

            let document_id = null;
            let document_name = null;
            let upload_id = null;
            let upload_dir_name = null;

            if (step.step_type_id === STATUS_TYPES.STEP_TYPES.UPLOAD_TO_BOT) {
              upload_id = step.upload_id;
              upload_dir_name = step.upload_dir_name;
            }
            else if (step.step_type_id === STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT) {
              document_id = step.document_id;
              document_name = step.document_name;
            }
            else {
              upload_id = step.upload_id;
              upload_dir_name = step.upload_dir_name;
              document_id = step.document_id;
              document_name = step.document_name;
            }

            databaseServices.createDocumentStep(
              newStep.id,
              upload_id,
              upload_dir_name,
              document_id,
              document_name
            ).then(result => {
              // Done
              console.log(`Created document step`);
            }, err => {
              console.error(`Error saving the document step:`);
              console.error(err);
              return res.send(err); // TODO: calling return from inside the callback function?!
            });
          } // Documents
        })
      );
    } else {
      // Update step
      promiseArray.push(
        databaseServices.updateStep(
          step.text,
          index + 1,
          step.id
        ).then(result => {
          let affectedCount = result[0];
          // let affectedRows = result[1]; // only supported in postgres with options.returning = true

          console.log(`Result from updated step`);
          console.log(affectedCount);
          // console.log(affectedRows);

          if (affectedCount === 1) {
            // Check if is multiple choice
            console.log(`Step updated (type = ${step.step_type_id})`);
            if (step.step_type_id === STATUS_TYPES.STEP_TYPES.MULTIPLE_CHOICE) {
              step.step_choices.forEach((choice, index) => {
                // TODO: what if the user removed options? etc.
                console.log(`Choice index: ${index}`);
                if (choice.id === undefined) {
                  // Create choice
                  databaseServices.createStepChoice(
                    choice.text,
                    index + 1,
                    step.id
                  ).then(result => {
                    // Done
                    console.log(`Created choice step`);
                  }, err => {
                    console.error(`Error saving the step choice:`);
                    console.error(err);
                    return res.send(err);
                  });
                } else {
                  // Update choice
                  databaseServices.updateStepChoice(
                    choice.text,
                    index + 1,
                    choice.id
                  ).then(result => {
                    // Done
                    console.log(`Updated choice step`);
                  }, err => {
                    console.error(`Error saving the step choice:`);
                    console.error(err);
                    return res.send(err);
                  });
                }
              });
            } // Multiple choice

            else if (step.step_type_id === STATUS_TYPES.STEP_TYPES.UPLOAD_TO_BOT ||
              step.step_type_id === STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT ||
              step.step_type_id === STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK) {
              //DOCUMENTS
              console.log(`step.upload_id: ${step.upload_id}`);
              console.log(`step.document_id: ${step.document_id}`);
              console.log(`step.document_name: ${step.document_name}`);
              console.log(`step.upload_dir_name: ${step.upload_dir_name}`);

              let document_id = null;
              let document_name = null;
              let upload_id = null;
              let upload_dir_name = null;

              if (step.step_type_id === STATUS_TYPES.STEP_TYPES.UPLOAD_TO_BOT) {
                upload_id = step.upload_id;
                upload_dir_name = step.upload_dir_name;
              }
              else if (step.step_type_id === STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT) {
                document_id = step.document_id;
                document_name = step.document_name;
              }
              else {
                upload_id = step.upload_id;
                upload_dir_name = step.upload_dir_name;
                document_id = step.document_id;
                document_name = step.document_name;
              }

              databaseServices.getDocumentStep(step.id).then(documentStep => {

                if (documentStep === null) {
                  // No document step (how?)
                  databaseServices.createDocumentStep(
                    step.id,
                    upload_id,
                    upload_dir_name,
                    document_id,
                    document_name
                  ).then(result => {
                    // Done
                    console.log(`Created document step`);
                  }, err => {
                    console.error(`Error creating the document step:`);
                    console.error(err);
                    return res.send(err);
                  });
                }
                else {
                  // Update
                  databaseServices.updateDocumentStep(
                    step.id,
                    upload_id,
                    upload_dir_name,
                    document_id,
                    document_name
                  ).then(
                    result => {
                      // Done
                      console.log(`Updated document step`);
                    },
                    err => {
                      console.error(`Error updating the step document: `);
                      console.error(err);
                      return res.send(err);
                    });
                }
              });
            } // Documents
          }
        })
      );
    }
  });

  models.Sequelize.Promise
    .each(
      promiseArray, function (result, index) {
        console.log(`\n\n*****`);
        console.log(`Processed step:`);
        console.log(result);
        console.log(index);
        console.log(`*****\n\n`);
        // console.log(result[1]);
      })
    .then(results => {
      // results is the array of all promises (one for each step)
      console.log(`All steps processed.`);
      // console.log(results);
      return res.status(200).send();

      // console.error(`Error saving the step:`);
      // console.error(err);
      // return res.send(err);

    }, err => {
      console.log(`Error processing the steps:`);
      console.log(err);
      return res.send(err);
    });
});

// ——————————————————————————————————————————————————
//                    Send Flow
// ——————————————————————————————————————————————————

router.get('/flow/:id/send', ensureAuthenticated, function (req, res, next) {
  let promises = [
    databaseServices.getStepTypes(),
    databaseServices.getFlow(req.params.id)
  ];
  Promise.all(promises).then(values => {
    res.render('manager_flow_send', {
      title: values[1].name,
      flowId: req.params.id,
      stepTypes: values[0],
      active: 'Manager' // left side bar icon
    });
  }, err => {
    console.error(`Error fetching the step types or flow:`);
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
    return res.status(400).send(`No user ID provided!`);
  }

  databaseServices.findOrCreateRespondent(userId, req.user.spark_token).then(user => {
    databaseServices.getFlow(flowId).then(flow => {
      if (!flow.steps.length) {
        return res.status(400).send(`The flow has no steps.`);
      }
      // Continue
      databaseServices.findOrCreateRespondentFlow(assignerId, user.id, flowId, assignDate).then(respondentFlow => {
        // OK
        sparkAPIUtils.startFlowForUser(flowId, user.spark_id);
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
    databaseServices.getStepTypes(),
    databaseServices.getFlow(req.params.id),
    databaseServices.countUsers(req.params.id, '') //ir buscar TODAS as respostas
  ];
  Promise.all(promises).then(values => {
    res.render('manager_flow_answers', {
      title: values[1].name,
      flowId: req.params.id,
      stepTypes: values[0],
      active: 'Manager', // left side bar icon
      totalAnswers: values[2]
    });
  }, err => {
    console.error(`Error fetching the step types, flow or answers:`);
    console.error(err);
  });
});


// ——————————————————————————————————————————————————
//                   Flow Dashboard
// ——————————————————————————————————————————————————

router.get('/flow/:id/dashboard', ensureAuthenticated, function (req, res, next) {
  let promises = [
    databaseServices.getStepTypes(),
    databaseServices.getFlow(req.params.id),
    databaseServices.getRespondentsByStatus(req.params.id),
    databaseServices.getAnswersByQuestion(req.params.id),
    databaseServices.getStepChoiceAnswersByQuestion(req.params.id),
    databaseServices.getMinFlowTime(req.params.id),
    databaseServices.getMaxFlowTime(req.params.id),
    databaseServices.getAvgFlowTime(req.params.id),
  ];
  Promise.all(promises).then(values => {
    res.render('manager_flow_dashboard', {
      title: values[1].name,
      flowId: req.params.id,
      stepTypes: values[0],
      active: 'Manager', // left side bar icon
      usersArray: values[2],
      answersArray: values[3],
      stepChoiceArray: values[4],
      minTime: values[5],
      maxTime: values[6],
      avgTime: values[7],
    });
  }, err => {
    console.error(`Error fetching the step types or flow:`);
    console.error(err);
  });
});

module.exports = router;