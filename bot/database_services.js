"use strict";

const models = require('../models');
const sparkAPIUtils = require('./spark_api_utils');

const STATUS_TYPES = require('./status_types');

let botControllers = [];

module.exports = {
  takeTheBotsControllers: bc => {
    botControllers = bc;
  },

  saveBot: bot => {
    // TODO: save the manager_id
    let { id, managerId, name, accessToken, publicHttpsAddress, webhookName, secret } = bot;
    console.log(`Bot to save:`);
    console.log(id);
    console.log(managerId);
    console.log(name);
    console.log(accessToken);
    console.log(publicHttpsAddress);
    console.log(webhookName);
    console.log(secret);
    console.log(`---`);
    if (!id) {
      // New bot
      return models.bot.create({
        manager_id: managerId,
        name: name,
        access_token: accessToken,
        public_https_address: publicHttpsAddress,
        webhook_name: webhookName,
        secret: secret
      });
    } else {
      // Update existing
      return models.bot.update({
        manager_id: managerId,
        name: name,
        access_token: accessToken,
        public_https_address: publicHttpsAddress,
        webhook_name: webhookName,
        secret: secret
      }, {
        where: {
          id: id,
          manager_id: managerId
        }
      });
    }
  },

  getBots: id => {
    // TODO: filter by manager?
    const attributes = ['id', 'name', 'access_token', 'public_https_address', 'webhook_name', 'secret'];
    if (id >= 0) {
      return models.bot.find({ attributes: attributes, where: { id: id } });
    } else {
      return models.bot.findAll({ attributes: attributes });
    }
  },

  getBotsNames: () => {
    return models.bot.findAll({
      attributes: ['id', 'name']
    });
  },

  getFlowBotController: flowId => {
    return new Promise((resolve, reject) => {
      models.flow.find({ attributes: ['bot_id'], where: { id: flowId } }).then(flow => {
        models.bot.find({ attributes: ['webhook_name'], where: { id: flow.bot_id } }).then(bot => {
          if (bot === null) {
            reject(`No bot for this flow`);
            return;
          }

          botControllers.forEach(botController => {
            if (botController.config.webhook_name === bot.webhook_name) {
              console.log(`Resolving the bot controller for ${bot.webhook_name}`);
              resolve(botController);
            }
          });

          reject(`No bot controller found for the webhook name ${bot.webhook_name}`);
        })
      })
    });
  },

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
          console.error(`Error fetching the user:`);
          console.error(err);
          reject(err)
        });
      }, err => {
        console.error(`Error fetching the tenant:`);
        console.error(err);
        reject(err);
      });
    });
  },

  getFlows: () => {
    console.log(`getFlows()`);
    // Returns flows for the logged in tenant
    return models.flow.findAll({
      attributes: ['id', 'name'],
      where: {
        // TODO filter by logged in user !!!
        //   ownerId: 1
      },
      order: [
        ['id', 'ASC']
      ],
      include: [
        { model: models.flow_status, attributes: ['description'] }
      ],
    });
  },

  getFlow: (flowId, startingStepId) => {
    return new Promise((resolve, reject) => {
      if (startingStepId) {
        // Get the step order for this step so we get only the steps after this (including it)
        models.step.find({
          attributes: ['id', 'step_order'],
          where: { id: startingStepId }
        }).then(step => {
          console.log(`Found the step order of the current step: ${step.step_order}`);
          getFlowStartingOnStepOrder(resolve, reject, flowId, step.step_order);
        });
      } else {
        getFlowStartingOnStepOrder(resolve, reject, flowId, 0);
      }
    });
  },

  updateFlow: flow => {
    return models.flow.update({
      name: flow.name,
      bot_id: flow.botId,
    }, {
      where: { id: flow.id }
    });
  },

  getFlowName: id => {
    return new Promise((resolve, reject) => {
      // TODO: check security
      // Get flow
      models.flow.find({ where: { id: id } }).then(flow => {
        resolve(flow.name);
      }, err => {
        console.error(`Error fetching the flow:`);
        console.error(err);
        reject(err)
      });
    });
  },

  getFlowSteps: flowId => {
    /**
     Used to show the steps at the edit flow page
     */
    // TODO: filter by user, do not allow accessing other users flows
    // TODO: add attributes [] to filter columns
    return models.step.findAll({
      where: { flow_id: flowId },
      include: [
        { model: models.step_choice },
        { model: models.document_step }
      ],
      order: [
        [models.Sequelize.col('"step_order"'), 'ASC'],
        [models.step_choice, '"choice_order"', 'ASC']
      ],
    });
  },

  createFlow: name => {
    return models.flow.create({
      name: name,
      flow_status_id: STATUS_TYPES.FLOW_STATUS.EDITING
    });
  },

  createAnnouncementStep: (stepText, stepOrder, flowId, stepTypeId) => {
    return models.step.create({
      text: stepText,
      step_order: stepOrder,
      flow_id: flowId,
      step_type_id: stepTypeId,
    });
  },

  updateStep: (stepText, stepOrder, stepId) => {
    return models.step.update({
      text: stepText,
      step_order: stepOrder,
    }, {
      where: { id: stepId }
    });
  },

  createStepChoice: (choiceText, choiceOrder, stepId) => {
    return models.step_choice.create({
      text: choiceText,
      choice_order: choiceOrder,
      step_id: stepId,
    });
  },

  updateStepChoice: (choiceText, choiceOrder, stepChoiceId) => {
    return models.step_choice.update({
      text: choiceText,
      choice_order: choiceOrder,
    }, {
      where: { id: stepChoiceId }
    });
  },

  getDocumentStep: stepId => {
    return models.document_step.find({
      where: { step_id: stepId }
    });
  },

  createDocumentStep: (stepId, uploadDir, uploadDirName, documentUrl, documentName) => {
    if (uploadDir === null) {
      console.log("uploadDir is null");
      uploadDir = 'root';
      uploadDirName = 'root';
    }
    return models.document_step.create({
      //document_store_id: ,
      step_id: stepId,
      upload_dir: uploadDir,
      upload_dir_name: uploadDirName,
      document_url: documentUrl,
      document_name: documentName
    });
  },

  updateDocumentStep: (stepId, uploadDir, uploadDirName, documentUrl, documentName) => {
    return models.document_step.update({
      upload_dir: uploadDir,
      upload_dir_name: uploadDirName,
      document_url: documentUrl,
      document_name: documentName,
    }, {
      where: { step_id: stepId }
    });
  },

  getStepTypes: () => {
    return models.step_type.findAll({
      order: ['id']
    });
  },

  getOldestPendingFlowForUserEmail: email => {
    return new Promise((resolve, reject) => {
      models.respondent.find({ where: { email: email } }).then(respondent => {
        if (respondent) {
          models.respondent_flow.find({
            where: {
              respondent_id: respondent.id,
              respondent_flow_status_id: STATUS_TYPES.RESPONDENT_FLOW_STATUS.NOT_STARTED
            }
            // TODO: sort by ID and resolve the oldest?
          }).then(respondentFlow => {
            if (respondentFlow) {
              //update START_DATE
              respondentFlow.updateAttributes({
                start_date: new Date(),
              });
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
      models.respondent.find({ where: { email: email } }).then(respondent => {
        if (respondent) {
          models.respondent_flow.find({
            where: {
              respondent_id: respondent.id,
              respondent_flow_status_id: {
                $in: [STATUS_TYPES.RESPONDENT_FLOW_STATUS.IN_PROGRESS, STATUS_TYPES.RESPONDENT_FLOW_STATUS.NOT_STARTED]
              }
              //respondent_flow_status_id: STATUS_TYPES.RESPONDENT_FLOW_STATUS.IN_PROGRESS
            },
            include: [{
              model: models.flow,
              attributes: ['name']
            }],
            // TODO: limit to the oldest per user
          }).then(respondentFlow => {
            if (respondentFlow) {
              if (respondentFlow.start_date === null) {
                respondentFlow.updateAttributes({
                  start_date: new Date(),
                });
              }

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
      include: [{
          model: models.respondent
        }, ]
        // TODO: limit to the oldest per user
    }); //.then(flows => {
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
    let date = new Date();
    respondentFlow.updateAttributes({
      respondent_flow_status_id: STATUS_TYPES.RESPONDENT_FLOW_STATUS.FINISHED,
      end_date: date,
    });

    models.respondent_flow.find({
      attributes: ['start_date', 'assign_date'],
      where: {
        id: respondentFlow.dataValues.id
      }
    }).then(times => {
      let start_date = times.dataValues.start_date;
      //start date lost
      if (start_date === null && date !== null) {
        start_date = times.dataValues.assign_date;
      }

      //update duration and start date, if lost
      let duration = Math.floor(date / 1000) - Math.floor(start_date / 1000);
      respondentFlow.updateAttributes({
        duration_seconds: duration,
        start_date: start_date,
      });

    }, err => {
      console.error(`Error updating flow duration`);
      console.error(err);
    });
  },

  getAnswers: (flow_id, resp_id) => {
    console.log(`getAnswers(${flow_id},${resp_id})`);
    return new Promise((resolve, reject) => {
      models.respondent_answer.findAll({
        attributes: ['id', 'text', 'document_url', 'answer_date'],
        where: {
          answer_status_id: STATUS_TYPES.ANSWER_STATUS.ANSWERED, //ja respondidas
          respondent_flow_id: resp_id, //para este utilizador
        },
        include: [{
            model: models.step,
            attributes: ['step_order', 'text', 'step_type_id'],
            where: {
              $or: [
                { step_type_id: STATUS_TYPES.STEP_TYPES.FREE_TEXT },
                { step_type_id: STATUS_TYPES.STEP_TYPES.MULTIPLE_CHOICE },
                { step_type_id: STATUS_TYPES.STEP_TYPES.UPLOAD_TO_BOT },
                { step_type_id: STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK },
              ]
            },
            include: [{
              model: models.document_step,
              attributes: ['upload_dir_name'],
            }, ],
          },
          {
            model: models.step_choice,
            attributes: ['choice_order', 'text'],
          },
        ],
        order: [
          [models.Sequelize.col('step.step_order'), 'ASC']
        ],
      }).then(details => {
        resolve(details);
      }, err => {
        console.error(`Error getting answers`);
        console.error(err);
        reject(err);
      });
    });
  },

  getUsers: (flow_id, page, per_page, filter, orders) => {
    console.log(`getAnswers(${flow_id},${page},${per_page},${filter},[${orders}])`);
    orders.forEach(function(order) {
      order[0] = models.Sequelize.col(order[0]);
    });

    return new Promise((resolve, reject) => {
      models.respondent_flow.findAll({
        attributes: ['id', 'start_date', 'end_date'],
        where: {
          flow_id: flow_id,
          $or: [{
            '$respondent.name$': { $iLike: '%' + filter + '%' }
          }, {
            '$respondent_flow_status.description$': { $iLike: '%' + filter + '%' },
          }],
        },
        include: [{
            model: models.respondent,
            attributes: ['name'],
          },
          {
            model: models.respondent_flow_status,
            attributes: ['id', 'description'],
          },
        ],
        limit: per_page,
        offset: per_page * page,
        order: orders, //[[models.Sequelize.col(sort), order]]
      }).then(users => {
        users.forEach(function(user) {
          user.details = null;
        });
        resolve(users);
      }, err => {
        console.error(`Error getting answers`);
        console.error(err);
        reject(err);
      });
    });
  },

  countUsers: (flow_id, filter) => {
    console.log(`countUsers(${flow_id}, ${filter})`);
    return new Promise((resolve, reject) => {
      models.respondent_flow.count({
        where: {
          flow_id: flow_id
        },
        include: [{
          model: models.respondent,
          attributes: ['name'],
          where: {
            name: {
              $like: '%' + filter + '%',
            }
          }
        }],
      }).then(res => {
        console.log(`----`);
        console.log(res);
        resolve(res);
      }, err => {
        console.error(`Error getting answers`);
        console.error(err);
        reject(err);
      });
    });
  },

  totalAnswers: (flow_id) => {
    console.log(`totalAnswers(${flow_id})`);
    return new Promise((resolve, reject) => {
      models.respondent_answer.findAll({
        where: {
          answer_status_id: STATUS_TYPES.ANSWER_STATUS.ANSWERED,
        },
        include: [{
            model: models.respondent_flow,
            attributes: ['id'],
            where: {
              flow_id: flow_id
            },
            include: [{
                model: models.respondent,
                attributes: ['name'],
              },
              {
                model: models.respondent_flow_status,
                attributes: ['description'],
              }
            ]
          },
          {
            model: models.step,
            attributes: ['step_order', 'text', 'step_type_id'],
            where: {
              $or: [
                { step_type_id: STATUS_TYPES.STEP_TYPES.FREE_TEXT },
                { step_type_id: STATUS_TYPES.STEP_TYPES.MULTIPLE_CHOICE },
                { step_type_id: STATUS_TYPES.STEP_TYPES.UPLOAD_TO_BOT },
                { step_type_id: STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK }
              ],
            },
            include: [{
              model: models.document_step,
              attributes: ['upload_dir_name'],
            }, ]
          },
          {
            model: models.step_choice,
            attributes: ['choice_order', 'text'],
          }
        ],
        order: [
          [models.Sequelize.col('respondent_flow->respondent.name'), 'ASC'],
          [models.Sequelize.col('step.step_order'), 'ASC']
        ],
      }).then(res => {
        console.log(`----`);
        console.log(res.length);
        resolve(res);
      }, err => {
        console.error(`Error getting answers`);
        console.error(err);
        reject(err);
      });
    });
  },

  getAnswersByQuestion: (flowId) => {
    console.log(`getAnswersByQuestion(${flowId})`);
    return new Promise((resolve, reject) => {
      models.step.findAll({
        attributes: [
          ['step_order', 'name'], 'id', 'text', 'step_type_id'
        ],
        where: {
          flow_id: flowId,
          $or: [
            { step_type_id: STATUS_TYPES.STEP_TYPES.FREE_TEXT },
            { step_type_id: STATUS_TYPES.STEP_TYPES.MULTIPLE_CHOICE },
            { step_type_id: STATUS_TYPES.STEP_TYPES.UPLOAD_TO_BOT },
            { step_type_id: STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK }
          ],
        },
        order: [
          [models.Sequelize.col('"name"'), 'ASC']
        ]
      }).then(res => {
        //so avanca depois de preencher todos os elementos
        let counter = 0;
        //contar respostas por cada elemento
        res.forEach(function(element) {
          models.respondent_answer.count({
            where: {
              step_id: element.dataValues.name,
              answer_status_id: STATUS_TYPES.ANSWER_STATUS.ANSWERED,
            }
          }).then(count => {
            element.dataValues.name = element.dataValues.name + " : " + element.dataValues.text;
            element.dataValues.y = count;

            if (element.dataValues.step_type_id === STATUS_TYPES.STEP_TYPES.MULTIPLE_CHOICE) {
              element.dataValues.drilldown = element.dataValues.name;
            } else {
              element.dataValues.drilldown = null;
            }

            counter++;
            //termina se ja percorreu todas
            if (counter === res.length) {
              resolve(res);
            }
          });
        });
        //termina se ja percorreu todas
        if (counter === res.length) {
          resolve(res);
        }
      }, err => {
        console.error(`Error getting answers`);
        console.error(err);
        reject(err);
      });
    });
  },

  getStepChoiceAnswersByQuestion: (flowId) => {
    console.log(`getStepChoiceAnswersByQuestion(${flowId})`);

    // Let's use a raw query since it is much easier to express our intents in SQL than in the ORM
    let query = `select s.flow_id, 
	    s.id as step_id,
      s.text as step_text,
      sc.id as step_choice_id, 
      sc.text, 
      sum(case when ra.id is null then 0 else 1 end) as hits
    from step s
    inner join flow f on f.id = s.flow_id
    left outer join step_choice sc on sc.step_id = s.id
    left outer join respondent_answer ra on ra.step_id = s.id and ra.step_choice_id = sc.id and ra.answer_status_id = 2
    where f.id = :flowId
    and s.step_type_id in (2, 3, 4, 6)
    group by s.flow_id, s.id, s.text, sc.id, sc.text
    order by 1, 2, s.step_order, sc.choice_order`;

    return new Promise((resolve, reject) => {
      models.sequelize.query(query, { replacements: { flowId: flowId }, type: models.sequelize.QueryTypes.SELECT }).then(answers => {

        // Let's combine the results into a data strtucture that can be processed by the frontend
        let result = answers.reduce((agg, row, index, array) => {
          if (agg.previous_step_id !== row.step_id) {
            agg.previous_step_id = row.step_id;
            agg.step_idx++;
            agg.value_idx = 1;
            agg.cat_idx = 0;
            if (row.step_choice_id != null) {
              agg.values[agg.step_idx] = [row.step_text];
              agg.categories[agg.step_idx] = [];
            }
          }
          if (row.step_choice_id != null) {
            agg.values[agg.step_idx][agg.value_idx] = row.hits;
            agg.categories[agg.step_idx][agg.cat_idx] = row.text;
            agg.value_idx++;
            agg.cat_idx++;
          }
          return agg;

        }, {
          flowId: flowId,
          values: [],
          categories: [],
          step_idx: -1,
          previous_step_id: -1,
          value_idx: 0,
          cat_idx: 0
        });

        resolve(result);
      });
    });


    // The above code should produce a data structure similar to the following
    /*
    let stepChoiceAnswers = {
      flowId: flowId,
      values: [, , ['How many years of experience do you have', 1, 0, 0, 2],
        ['Another multiple-choice question', 1, 2, 0]
      ],
      categories: [, , ['None', 'Less than 2 years', 'Between 2 and 5 years', 'More than 5 years'],
        ['First option', 'Second option', 'Third option']
      ]
    };
    return stepChoiceAnswers;
    */
  },

  saveAnnouncementAnswer: (respondentFlow, step, nextStep) => {
    updateRespondentFlowCurrentStep(respondentFlow, nextStep);
  },

  saveTextAnswer: (respondentFlow, step, nextStep, text) => {
    models.respondent_answer.create({
      text: text,
      answer_status_id: STATUS_TYPES.ANSWER_STATUS.ANSWERED, // 2 === Answered
      answer_date: new Date(),
      respondent_flow_id: respondentFlow.id,
      step_id: step.id,
    }).then(() => {
      updateRespondentFlowCurrentStep(respondentFlow, nextStep);
    });
  },

  saveMultipleChoiceAnswer: (respondentFlow, step, nextStep, choiceId) => {
    models.respondent_answer.create({
      answer_status_id: STATUS_TYPES.ANSWER_STATUS.ANSWERED, // 2 === Answered
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
      answer_status_id: STATUS_TYPES.ANSWER_STATUS.ANSWERED, // 2 === Answered
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
      sparkAPIUtils.getUserFromSpark({ sparkId: sparkId }, bearer).then(users => {
        console.log(`Result from Spark search:`);
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
        console.log(`Error fetching the user from Spark:`);
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
            { respondent_flow_status_id: STATUS_TYPES.RESPONDENT_FLOW_STATUS.NOT_STARTED },
            { respondent_flow_status_id: STATUS_TYPES.RESPONDENT_FLOW_STATUS.IN_PROGRESS },
          ],
        },
        defaults: {
          assigner_id: assignerId,
          respondent_id: userId,
          flow_id: flowId,
          respondent_flow_status_id: STATUS_TYPES.RESPONDENT_FLOW_STATUS.NOT_STARTED,
          assign_date: date,
          start_date: date,
        },
        include: [{
          model: models.flow
        }]
      }).then(result => resolve(result[0]));
    });
  },

  getRespondentsByStatus: (flowId) => {
    console.log("getRespondentsByStatus(flow_id)");
    return new Promise((resolve, reject) => {
      models.respondent_flow.count({
        attributes: [
          ['respondent_flow_status_id', 'name']
        ],
        where: {
          flow_id: flowId,
        },
        group: ['respondent_flow_status_id'],
        order: [
          [models.Sequelize.col('"respondent_flow_status_id"'), 'ASC']
        ]
      }).then(res => {
        res.forEach(function(element) {
          models.respondent_flow_status.find({
            attributes: ['description'],
            where: {
              id: element.name
            }
          }).then(text => {
            element.name = text.description;
          });
        });
        resolve(res);
      }, err => {
        console.error(`Error getting answers by question`);
        console.error(err);
        reject(err);
      });
    });
  },

  getAvgFlowTime: (flowId) => {
    console.log("getAvgFlowTime(flow_id)");
    return new Promise((resolve, reject) => {
      models.respondent_flow.find({
        attributes: [
          [models.Sequelize.fn('AVG', models.Sequelize.col('duration_seconds')), 'avg']
        ],
        where: {
          respondent_flow_status_id: STATUS_TYPES.RESPONDENT_FLOW_STATUS.FINISHED,
          flow_id: flowId,
        }
      }).then(avg => {
        let sec = Math.floor(avg.dataValues.avg);
        if (sec === 0)
          resolve("No Data");
        else
          resolve(secondsToTime(sec));
      }, err => {
        console.error(`Error getting average flow time`);
        console.error(err);
        reject(err);
      });
    });
  },

  getMinFlowTime: (flowId) => {
    console.log("getMinFlowTime(flow_id)");
    return new Promise((resolve, reject) => {
      models.respondent_flow.min('duration_seconds', {
        where: {
          respondent_flow_status_id: STATUS_TYPES.RESPONDENT_FLOW_STATUS.FINISHED,
          flow_id: flowId,
        }
      }).then(min => {
        if (isNaN(min))
          resolve("No Data");
        else
          resolve(secondsToTime(min));
      }, err => {
        console.error(`Error getting min flow time`);
        console.error(err);
        reject(err);
      });
    });
  },

  getMaxFlowTime: (flowId) => {
    console.log("getMaxFlowTime(flow_id)");
    return new Promise((resolve, reject) => {
      models.respondent_flow.max('duration_seconds', {
        where: {
          respondent_flow_status_id: STATUS_TYPES.RESPONDENT_FLOW_STATUS.FINISHED,
          flow_id: flowId,
        }
      }).then(max => {
        if (isNaN(max))
          resolve("No Data");
        else
          resolve(secondsToTime(max));
      }, err => {
        console.error(`Error getting max flow time`);
        console.error(err);
        reject(err);
      });
    });
  },

  //DELETES -> WARNING
  deleteStep: step_id => {
    console.log(`Delete step ${step_id}`);
    models.step.findById(step_id).then(step => {
      step.destroy();
    });
  },

  deleteStepChoice: step_choice_id => {
    console.log(`Delete step choice ${step_id}`);
    models.step_choice.findById(step_choice_id).then(step_choice => {
      step_choice.destroy();
    });
  },

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
        step_order: {
          gte: startingStepOrder
        }
      },
      order: [
        [models.Sequelize.col('"step_order"'), 'ASC'],
        [models.step_choice, '"choice_order"', 'ASC']
      ],
      include: [{
          model: models.step_choice
        },
        {
          model: models.document_step
        }
      ]
    }).then(steps => {
      const result = {
        // respondent_flow_id: 345,
        flowId: flow.id,
        name: flow.name,
        status: flow.flow_status_id,
        steps: steps,
        botId: flow.bot_id
      };
      console.log(`Got the flow with its steps, resolving:`);
      console.log(result);
      resolve(result);
    }, err => {
      console.error(`Error fetching the steps:`);
      console.error(err);
      reject(err)
    });
  }, err => {
    console.error(`Error fetching the flow:`);
    console.error(err);
    reject(err)
  })
}

function updateRespondentFlowCurrentStep(respondentFlow, nextStep) {
  if (!nextStep) {
    // Last step?
    console.log(`No next step`);
    return;
  }
  console.log(`Next step will be ${nextStep.id}`);
  respondentFlow.updateAttributes({
    current_step_id: nextStep.id
  });
}

function secondsToTime(seconds) {
  let date = new Date(null);
  date.setSeconds(seconds); // specify value for SECONDS here
  let dateStr = "";

  //mais que um dia -> implica data inteira
  if (seconds >= 86400) {
    let days = Math.floor(seconds / 86400);
    if (days === 1)
      dateStr = days + " day ";
    else
      dateStr = days + " days ";

    dateStr += date.getHours() + " h " + date.getMinutes() + " min " + date.getSeconds() + " secs";
  } else {
    if (date.getHours() !== 0) {
      dateStr += date.getHours();
    }
    if (date.getMinutes() !== 0) {
      dateStr += date.getMinutes() + " min ";
    }
    dateStr += date.getSeconds() + " secs";
  }

  return dateStr;
}