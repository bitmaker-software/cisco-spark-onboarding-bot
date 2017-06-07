"use strict";

var models = require('../models');
var express = require('express');
var router = express.Router();
var ensureAuthenticated = require('./auth_middleware');

//
//
// Main manager page (list of flows)
//
//
router.get('/', ensureAuthenticated, function (req, res, next) {
  getFlows().then(flows => {
    res.render('manager_flows', {
      title: 'Onboarding manager',
      flows: flows,
    });
    console.log('........');
    console.log(flows);
  }, err => {
    console.error("Error fetching the flows:");
    console.error(err);
  });
});

// router.get('/flow/new', ensureAuthenticated, function (req, res, next) {
//   res.send('To be implemented');
// });

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


//
//
// Flow page (list of steps)
//
//
router.get('/flow/:id', ensureAuthenticated, function (req, res, next) {
  let promises = [
    getStepTypes(),
    getFlow(req.params.id)
  ];
  Promise.all(promises).then(values => {
    res.render('manager_flow_steps', {
      title: values[1][0].name,
      flowId: req.params.id,
      stepTypes: values[0]
    });
  }, err => {
    console.error("Error fetching the step types or flow:");
    console.error(err);
  });
});

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

router.put('/api/flow', ensureAuthenticated, function (req, res, next) {
  console.log('Update flow, got:');
  console.log(req.body);
  // TODO check this steps belongs to this flow and this flow belongs to the user requesting this !!!!!!!!!!
  // TODO handle multiple db queries and send response only when finished!
  req.body.steps.forEach(step => {
    if (step.id === undefined) {
      // New step
      models.step.create(
        {
          text: step.text,
          step_order: step.step_order,
          flow_id: req.body.flow_id,
          step_type_id: step.step_type,
        }
      ).then(result => {
        if (step.step_type === 4) {
          // Multiple choice
          console.log("step.step_choices:");
          console.log(step.step_choices);
          step.step_choices.forEach((choice, index) => {
            console.log("Step index: " + index);
            models.step_choice.create(
              {
                text: choice.text,
                choice_order: choice.choice_order,
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
        return res.sendStatus(200); // TODO: send here? there are multiple promises
      });
      // end of creating new step
    } else {
      models.step.update(
        {
          text: step.text,
          step_order: step.step_order,
        }, {where: {id: step.id}}
      ).then(result => {
        if (step.step_type === 4) {
          // Multiple choice
          // TODO: what if the user removed options? etc.
          step.step_choices.forEach((choice, index) => {
            console.log("Choice index: " + index);
            models.step_choice.update({
                text: choice.text,
                choice_order: choice.choice_order,
              }, {where: {id: choice.id}}
            ).then(result => {
              //
            }, err => {
              console.error("Error saving the step choice:");
              console.error(err);
              return res.send(err);
            });
          });
        }
        return res.sendStatus(200); // TODO: send here? there are multiple promises
      }, err => {
        console.error("Error saving the step:");
        console.error(err);
        return res.send(err);
      })
      // end of updating existing step
    }
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