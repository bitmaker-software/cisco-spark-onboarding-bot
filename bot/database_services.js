"use strict";

const models = require('../models');
const sparkAPIUtils = require('./spark_api_utils');

module.exports = {
  /*
   function called after a successful login via spark oauth.
   Check if the tenant and the user already exists, and create them if not
   */
  userLoggedIn: function (id, displayName, emails, orgId) {
    return new Promise(function (resolve, reject) {
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

  getFlow: flow_id => {
    return new Promise(function (resolve, reject) {
      // TODO: check security
      // Get flow
      models.flow.find({where: {id: flow_id}}).then(flow => {
        models.step.findAll({
          where: {flow_id: flow.id},
          order: [[models.Sequelize.col('"step_order"'), 'ASC'],
            [models.step_choice, '"choice_order"', 'ASC']],
          include: [
            {model: models.step_choice},
            {model: models.document_step}
          ]
        }).then(steps => {
          resolve({
            // respondent_flow_id: 345,
            flowId: flow.id,
            name: flow.name,
            status: flow.flow_status_id,
            steps: steps
          })
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
    });
  },

  getFlowName: id => {
    return new Promise(function (resolve, reject) {
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

  getOldestPendingFlowForUserEmail: email => {
    return new Promise(function (resolve, reject) {
      models.respondent.find({where: {email: email}}).then(respondent => {
        if (respondent) {
          resolve(models.respondent_flow.find(
            {
              where: {
                respondent_id: respondent.id,
                respondent_flow_status_id: 1 // 1 === Not started
              }
            }
          )); // TODO: sort by ID and resolve the oldest?
        } else {
          reject('Respondent not found');
        }
      })
    });
  },

  setRespondentFlowStarted: respondentFlow => {
    respondentFlow.updateAttributes({
      respondent_flow_status_id: 2 // 2 === Started / In progress
    });
  },

  setRespondentFlowFinished: respondentFlow => {
    respondentFlow.updateAttributes({
      respondent_flow_status_id: 3 // 3 === Finished
    });
  },

  getAnswers: function (flow_id, page, per_page, filter, sort, order) {
    console.log('getAnswers(' + flow_id + ' , ' + page + ' , ' + per_page + ' , ' + filter + ')');
    return new Promise(function (resolve, reject) {
      models.respondent_answer.findAll({
        attributes: ['id', 'answer_date', 'text', 'document_url'],
        where: {
          answer_status_id: 2,
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
                {step_type_id: 2},
                {step_type_id: 3},
                {step_type_id: 4},
                {step_type_id: 6}
              ],
            }
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
        console.log(answers);
        resolve(answers);
      }, err => {
        console.error("Error getting answers");
        console.error(err);
        reject(err);
      });
    });
  },

  countAnswers: function (flow_id, filter) {
    console.log('countAnswers(' + flow_id + ' , ' + filter + ')');
    return new Promise(function (resolve, reject) {
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
                {step_type_id: 2},
                {step_type_id: 3},
                {step_type_id: 4},
                {step_type_id: 6}
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

  saveTextAnswer: (respondent_flow_id, step_id, text) => {
    models.respondent_answer.create({
      text: text,
      answer_status_id: 2, // 2 === Answered
      answer_date: new Date(),
      respondent_flow_id: respondent_flow_id,
      step_id: step_id,
    });
  },

  saveMultipleChoiceAnswer: (respondentFlowId, stepId, choiceId) => {
    models.respondent_answer.create({
      answer_status_id: 2, // 2 === Answered
      answer_date: new Date(),
      respondent_flow_id: respondentFlowId,
      step_id: stepId,
      step_choice_id: choiceId,
    });
  },

  saveDocumentAnswer: (respondent_flow_id, step_id, url) => {
    models.respondent_answer.create({
      document_url: url,
      answer_status_id: 2, // 2 === Answered
      answer_date: new Date(),
      respondent_flow_id: respondent_flow_id,
      step_id: step_id
    });
  },

  getGoogleDriveCredentials: function (userId, storeId) {
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
          flow_id: flowId
        },
        defaults: {
          assigner_id: assignerId,
          respondent_id: userId,
          flow_id: flowId,
          respondent_flow_status_id: 1, // 1 === Not started
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