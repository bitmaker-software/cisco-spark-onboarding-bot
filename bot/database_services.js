"use strict";

const models = require('../models');
const sparkAPIUtils = require('./spark_api_utils');

const STATUS_TYPES = require('./status_types');

module.exports = {
  userLoggedIn: (id, displayName, emails, orgId) => {
    /**
     function called after a successful login via spark oauth.
     Check if the tenant and the user already exists, and create them if not
     */
    return new Promise((resolve, reject) => {
      models.tenant.findOrCreate({
        where: {
          org_id: orgId
        },
        defaults: {
          name: 'auto'
        }
      }).spread((tenant, tenantCreated) => {

        //check the user
        let email = null;
        if (emails && emails.length > 0) {
          email = emails[0];
        }
        models.manager.findOrCreate({
          where: {
            spark_id: id
          },
          defaults: {
            tenant_id: tenant.id,
            name: displayName,
            email: email
          }
        }).spread((user, userCreated) => {
          resolve(user);
        }, err => {
          console.error("Error fetching the user:");
          console.error(err);
          reject(err)
        });
      }, err => {
        console.error("Error fetching the tenant:");
        console.error(err);
        reject(err);
      });
    });
  },

  getFlows: () => {
    console.log('getFlows()');
    // Returns flows for the logged in tenant
    return models.flow.findAll({
      attributes: ['id', 'name'],
      where: {
        // TODO filter by logged in user !!!
        //   ownerId: 1
      },
      order: [['id', 'ASC']],
      include: [
        {model: models.flow_status, attributes: ['description']}
      ],
    });
  },

  getFlow: (flowId, startingStepId) => {
    return new Promise((resolve, reject) => {
      if (startingStepId) {
        // Get the step order for this step so we get only the steps after this (including it)
        models.step.find({
          attributes: ['id', 'step_order'],
          where: {id: startingStepId}
        }).then(step => {
          console.log(`Found the step order of the current step: ${step.step_order}`);
          getFlowStartingOnStepOrder(resolve, reject, flowId, step.step_order);
        });
      } else {
        getFlowStartingOnStepOrder(resolve, reject, flowId, 0);
      }
    });
  },

  getFlowName: id => {
    return new Promise((resolve, reject) => {
      // TODO: check security
      // Get flow
      models.flow.find({where: {id: id}}).then(flow => {
        resolve(flow.name);
      }, err => {
        console.error("Error fetching the flow:");
        console.error(err);
        reject(err)
      });
    });
  },

  createFlow: name => {
    return models.flow.create({
      name: name,
      flow_status_id: STATUS_TYPES.FLOW_STATUS.EDITING
    });
  },

  getStepTypes: () => {
    return models.step_type.findAll({order: 'id'});
  },

  getOldestPendingFlowForUserEmail: email => {
    return new Promise((resolve, reject) => {
      models.respondent.find({where: {email: email}}).then(respondent => {
        if (respondent) {
          models.respondent_flow.find(
            {
              where: {
                respondent_id: respondent.id,
                respondent_flow_status_id: STATUS_TYPES.RESPONDENT_FLOW_STATUS.NOT_STARTED
              }
              // TODO: sort by ID and resolve the oldest?
            }
          ).then(respondentFlow => {
            if (respondentFlow) {
              resolve(respondentFlow);
            } else {
              reject('No flow for this respondent');
            }
          });
        } else {
          reject('Respondent not found');
        }
      })
    });
  },

  getOngoingFlowForUserEmail: email => {
    return new Promise((resolve, reject) => {
      models.respondent.find({where: {email: email}}).then(respondent => {
        if (respondent) {
          models.respondent_flow.find(
            {
              where: {
                respondent_id: respondent.id,
                respondent_flow_status_id: STATUS_TYPES.RESPONDENT_FLOW_STATUS.IN_PROGRESS
              },
              include: [
                {model: models.flow, attributes: ['name']}
              ],
              // TODO: limit to the oldest per user
            }
          ).then(respondentFlow => {
            if (respondentFlow) {
              resolve(respondentFlow);
            } else {
              reject('No flow for this respondent');
            }
          });
        } else {
          reject('Respondent not found');
        }
      })
    });
  },

  getAllOngoingFlows: () => {
    return models.respondent_flow.findAll({
      where: {
        respondent_flow_status_id: STATUS_TYPES.RESPONDENT_FLOW_STATUS.IN_PROGRESS
      },
      include: [
        {model: models.respondent},
      ]
      // TODO: limit to the oldest per user
    });//.then(flows => {
    // if (respondentFlow) {
    //   resolve(respondentFlow);
    // } else {
    //   reject('No flow for this respondent');
    // }
    // });
    // } else {
    //   reject('Respondent not found');
    // }
    // })
    // });
  },

  setRespondentFlowStarted: respondentFlow => {
    respondentFlow.updateAttributes({
      respondent_flow_status_id: STATUS_TYPES.RESPONDENT_FLOW_STATUS.IN_PROGRESS
    });
  },

  setRespondentFlowFinished: respondentFlow => {
    respondentFlow.updateAttributes({
      respondent_flow_status_id: STATUS_TYPES.RESPONDENT_FLOW_STATUS.FINISHED
    });
  },

  getAnswers: (flow_id, page, per_page, filter, sort, order) => {
    console.log('getAnswers(' + flow_id + ' , ' + page + ' , ' + per_page + ' , ' + filter + ')');
    return new Promise((resolve, reject) => {
      models.respondent_answer.findAll({
        attributes: ['id', 'answer_date', 'text', 'document_url'],
        where: {
          answer_status_id: STATUS_TYPES.ANSWER_STATUS.ANSWERED,
        },
        include: [
          {
            model: models.respondent_flow,
            attributes: ['id'],
            where: {
              flow_id: flow_id
            },
            include: [
              {
                model: models.respondent,
                attributes: ['name'],
                where: {
                  name: {
                    $like: '%' + filter + '%',
                  }
                }
              }
            ]
          },
          {
            model: models.step,
            attributes: ['step_order', 'text', 'step_type_id'],
            where: {
              $or: [
                {step_type_id: STATUS_TYPES.STEP_TYPES.FREE_TEXT},
                {step_type_id: STATUS_TYPES.STEP_TYPES.MULTIPLE_CHOICE},
                {step_type_id: STATUS_TYPES.STEP_TYPES.UPLOAD_TO_BOT},
                {step_type_id: STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK}
              ],
            },
            include: [
              {
                model: models.document_step,
                attributes: ['upload_dir_name'],
              },
            ]
          },
          {
            model: models.step_choice,
            attributes: ['choice_order', 'text'],
          },
        ],
        limit: per_page,
        offset: per_page * page,
        order: sort + ' ' + order
      }).then(answers => {
        //console.log(answers);
        resolve(answers);
      }, err => {
        console.error("Error getting answers");
        console.error(err);
        reject(err);
      });
    });
  },

  totalAnswers: (flow_id) => {
    console.log('totalAnswers(' + flow_id + ')');
    return new Promise((resolve, reject) => {
      models.respondent_answer.findAll({
        where: {
          answer_status_id: STATUS_TYPES.ANSWER_STATUS.ANSWERED,
        },
        include: [
          {
            model: models.respondent_flow,
            attributes: ['id'],
            where: {
              flow_id: flow_id
            },
            include: [
              {
                model: models.respondent,
                attributes: ['name'],
              }
            ]
          },
          {
            model: models.step,
            attributes: ['step_order', 'text', 'step_type_id'],
            where: {
              $or: [
                {step_type_id: STATUS_TYPES.STEP_TYPES.FREE_TEXT},
                {step_type_id: STATUS_TYPES.STEP_TYPES.MULTIPLE_CHOICE},
                {step_type_id: STATUS_TYPES.STEP_TYPES.UPLOAD_TO_BOT},
                {step_type_id: STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK}
              ],
            },
            include: [
              {
                model: models.document_step,
                attributes: ['upload_dir_name'],
              },
            ]
          },
          {
            model: models.step_choice,
            attributes: ['choice_order', 'text'],
          }
        ]
      }).then(res => {
        console.log("----");
        console.log(res.length);
        resolve(res);
      }, err => {
        console.error("Error getting answers");
        console.error(err);
        reject(err);
      });
    });
  },

  countAnswers: (flow_id, filter) => {
    console.log('countAnswers(' + flow_id + ' , ' + filter + ')');
    return new Promise((resolve, reject) => {
      models.respondent_answer.count({
        where: {
          answer_status_id: 2,
        },
        include: [
          {
            model: models.respondent_flow,
            where: {
              flow_id: flow_id
            },
            include: [
              {
                model: models.respondent,
                where: {
                  name: {
                    $like: '%' + filter + '%',
                  }
                }
              }
            ]
          },
          {
            model: models.step,
            where: {
              $or: [
                {step_type_id: STATUS_TYPES.STEP_TYPES.FREE_TEXT},
                {step_type_id: STATUS_TYPES.STEP_TYPES.MULTIPLE_CHOICE},
                {step_type_id: STATUS_TYPES.STEP_TYPES.UPLOAD_TO_BOT},
                {step_type_id: STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK}
              ],
            }
          },
        ]
      }).then(res => {
        console.log("----");
        console.log(res);
        resolve(res);
      }, err => {
        console.error("Error getting answers");
        console.error(err);
        reject(err);
      });
    });
  },

  saveAnnouncementAnswer: (respondentFlow, step, nextStep) => {
    updateRespondentFlowCurrentStep(respondentFlow, nextStep);
  },

  saveTextAnswer: (respondentFlow, step, nextStep, text) => {
    models.respondent_answer.create({
      text: text,
      answer_status_id: 2, // 2 === Answered
      answer_date: new Date(),
      respondent_flow_id: respondentFlow.id,
      step_id: step.id,
    }).then(() => {
      updateRespondentFlowCurrentStep(respondentFlow, nextStep);
    });
  },

  saveMultipleChoiceAnswer: (respondentFlow, step, nextStep, choiceId) => {
    models.respondent_answer.create({
      answer_status_id: 2, // 2 === Answered
      answer_date: new Date(),
      respondent_flow_id: respondentFlow.id,
      step_id: step.id,
      step_choice_id: choiceId,
    }).then(() => {
      updateRespondentFlowCurrentStep(respondentFlow, nextStep);
    });
  },

  saveDocumentUploadAnswer: (respondentFlow, step, nextStep, url) => {
    models.respondent_answer.create({
      document_url: url,
      answer_status_id: 2, // 2 === Answered
      answer_date: new Date(),
      respondent_flow_id: respondentFlow.id,
      step_id: step.id
    }).then(() => {
      updateRespondentFlowCurrentStep(respondentFlow, nextStep);
    });
  },

  saveDocumentDownloadAnswer: (respondentFlow, step, nextStep) => {
    updateRespondentFlowCurrentStep(respondentFlow, nextStep);
  },

  getGoogleDriveCredentials: (userId, storeId) => {
    return new Promise((resolve, reject) => {
      models.sequelize.query('select * from ﻿document_stores');
    });
  },

  findOrCreateRespondent: (sparkId, bearer) => {
    console.log(`At findOrCreateRespondent(sparkId = ${sparkId}, bearer = ${bearer})`);
    return new Promise((resolve, reject) => {
      // Get user info from Spark
      sparkAPIUtils.getUserFromSpark({sparkId: sparkId}, bearer).then(users => {
        console.log('Result from Spark search:');
        console.log(users);

        if (users.length !== 1) {
          reject();
        }

        let user = users[0];

        models.respondent.findOrCreate({
          where: {
            spark_id: sparkId
          },
          defaults: {
            tenant_id: 1, // TODO: where to get this from?
            name: user.displayName,
            email: user.email,
            spark_id: user.id
          }
        }).then(result => resolve(result[0]));
      }, error => {
        console.log('Error fetching the user from Spark:');
        console.log(error);
      });
    });
  },

  findOrCreateRespondentFlow: (assignerId, userId, flowId, date) => {
    console.log(`At findOrCreateRespondentFlow(assignerId = ${assignerId}, userId = ${userId}, flowId = ${flowId}, date = ${date})`);
    return new Promise((resolve, reject) => {
      models.respondent_flow.findOrCreate({
        where: {
          respondent_id: userId,
          flow_id: flowId,
          $or: [
            {respondent_flow_status_id: STATUS_TYPES.RESPONDENT_FLOW_STATUS.NOT_STARTED},
            {respondent_flow_status_id: STATUS_TYPES.RESPONDENT_FLOW_STATUS.IN_PROGRESS},
          ],
        },
        defaults: {
          assigner_id: assignerId,
          respondent_id: userId,
          flow_id: flowId,
          respondent_flow_status_id: STATUS_TYPES.RESPONDENT_FLOW_STATUS.NOT_STARTED,
          assign_date: date, // TODO
          start_date: date, // TODO
        },
        include: [{
          model: models.flow
        }]
      }).then(result => resolve(result[0]));
    });
  }

};

function getFlowStartingOnStepOrder(resolve, reject, flowId, startingStepOrder) {
  // TODO: check security
  // Get flow
  models.flow.find({
    where: {
      id: flowId
    }
  }).then(flow => {
    models.step.findAll({
      where: {
        flow_id: flow.id,
        step_order: {gte: startingStepOrder}
      },
      order: [[models.Sequelize.col('"step_order"'), 'ASC'],
        [models.step_choice, '"choice_order"', 'ASC']],
      include: [
        {model: models.step_choice},
        {model: models.document_step}
      ]
    }).then(steps => {
      const result = {
        // respondent_flow_id: 345,
        flowId: flow.id,
        name: flow.name,
        status: flow.flow_status_id,
        steps: steps
      };
      console.log('Got the flow with its steps, resolving:');
      console.log(result);
      resolve(result);
    }, err => {
      console.error("Error fetching the steps:");
      console.error(err);
      reject(err)
    });
  }, err => {
    console.error("Error fetching the flow:");
    console.error(err);
    reject(err)
  })
}

function updateRespondentFlowCurrentStep(respondentFlow, nextStep) {
  if (!nextStep) {
    // Last step?
    console.log('No next step');
    return;
  }
  console.log(`Next step will be ${nextStep.id}`);
  respondentFlow.updateAttributes({
    current_step_id: nextStep.id
  });
}