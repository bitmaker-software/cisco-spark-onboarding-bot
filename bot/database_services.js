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
          order: '"step_order"',
          include: [
            {model: models.step_choice}
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

  getAnswers: function (flow_id) {
    console.log('getAnswers('+flow_id+')');

    return new Promise(function (resolve, reject)
    {
      models.respondent_answer.findAll({
        attributes: ['answer_date','text','document_url'],
        where: {
          status: "Answered"
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
                attributes: ['name']
              }
            ]
          },
          {
            model: models.step,
            attributes: ['step_order','text','step_type_id'],
            where: {
              $or: [
                {step_type_id: 2},
                {step_type_id: 3},
                {step_type_id: 4}
              ]
            }
          },
          {
            model: models.step_choice,
            attributes: ['choice_order','text'],
          }
        ]
      }).then(result => {
        console.log(result);
          resolve(result)
        }, err => {
          console.error("Error getting answers");
          console.error(err);
          reject(err);
        });
    });
  },

  getGoogleDriveCredentials: function(userId, storeId){
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
          // flow_status_id: 1,
          assign_date: date, // TODO
          start_date: date, // TODO
        }
      }).then(result => resolve(result[0]));
    });
  }

};