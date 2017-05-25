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
          orgId: orgId
        },
        defaults: {
          name: 'auto'
        }
      }).then(tenant => {
        //check the user
        var email = null;
        if (emails && emails.length > 0) {
          email = emails[0];
        }
        models.user.findOrCreate({
          where: {
            sparkId: id
          },
          defaults: {
            tenant: tenant,
            name: displayName,
            email: email
          }
        }).then(user => {
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

  getFlow: flowId => {
    return new Promise(function (resolve, reject) {
      // TODO: check security
      // Get flow
      models.flow.find({where: {id: flowId}}).then(flow => {
        models.step.findAll({
          where: {flowId: flow.id},
          order: '"stepOrder"',
          include: [
            {model: models.step_choice}
          ]
        }).then(steps => {
          resolve({
            // respondent_flow_id: 345,
            flowId: flow.id,
            name: flow.name,
            status: flow.flowStatusId,
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

  getGoogleDriveCredentials: function(userId, storeId){
    return new Promise((resolve, reject) => {
      models.sequelize.query('select * from ﻿document_stores');
    });
  }

};