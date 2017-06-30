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

  getAnswers: function (flow_id,page,per_page,filter,sort,order) {
    console.log('getAnswers('+flow_id+' , '+page+' , '+per_page+' , '+filter+')');
    return new Promise(function (resolve, reject)
    {
      models.respondent_answer.findAll({
        attributes: ['id','answer_date','text','document_url'],
        where: {
          status: "Answered",
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
                    $like: '%'+filter+'%',
                  }
                }
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
              ],
            }
          },
          {
            model: models.step_choice,
            attributes: ['choice_order','text'],
          },
        ],
        limit: per_page,
        offset: per_page*page,
        order: sort+' '+order
      }).then(answers => {
        resolve(answers);
      }, err => {
          console.error("Error getting answers");
          console.error(err);
          reject(err);
        });
    });
  },

  countAnswers: function (flow_id,filter) {
    console.log('countAnswers('+flow_id+' , '+filter+')');
    return new Promise(function (resolve, reject)
    {
      models.respondent_answer.count({
          where: {
            status: "Answered",
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
                            $like: '%'+filter+'%',
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
                      {step_type_id: 4}
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
/*
  getFilteredAnswers: function (flow_id,page,per_page,filter) {
    console.log('getFilteredAnswers('+flow_id+' , '+page+' , '+per_page+' , '+filter+')');
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
                include: [{
                  model: models.respondent,
                  attributes: ['name'],
                  where: {
                    name: {
                        $like: '%'+filter+'%',
                    }
                  }
                }]
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
              },
          ],
          limit: per_page,
          offset: per_page*page
      }).then(answers => {
          // console.log("----");
          //console.log(answers);
          resolve(answers);
      }, err => {
          console.error("Error getting answers");
          console.error(err);
          reject(err);
      });
    });
  },
  */

  getGoogleDriveCredentials: function(userId, storeId){
    return new Promise((resolve, reject) => {
      models.sequelize.query('select * from ﻿document_stores');
    });
  },

};