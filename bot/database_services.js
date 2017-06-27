"use strict";

var models = require('../models');

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
        var email = null;
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
  }

};