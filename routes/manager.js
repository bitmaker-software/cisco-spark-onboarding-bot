"use strict";

var models = require('../models');
var express = require('express');
var router = express.Router();
var ensureAuthenticated = require('./auth_middleware');

/* GET manager. */
router.get('/', ensureAuthenticated, function (req, res, next) {
  getFlows().then(flows => {
    res.render('manager', {
      title: 'Onboarding manager',
      flows: flows,
    });
  }, err => {
    console.error("Error fetching the flows:");
    console.error(err);
  });
});

router.get('/flow/new', ensureAuthenticated, function (req, res, next) {
  res.send('To be implemented');
});

router.get('/flow/:id', ensureAuthenticated, function (req, res, next) {
  let promises = [
    getStepTypes(),
    getFlow(req.params.id)
  ];
  Promise.all(promises).then(values => {
    res.render('flow', {
      title: values[1][0].name,
      flowId: req.params.id,
      stepTypes: values[0]
    });
  }, err => {
    console.error("Error fetching the step types or flow:");
    console.error(err);
  });
});

function getFlows(id) {
  // Returns flows for the logged in tenant
  let config = {
    where: {
      // TODO filter by logged in user !!!
      //   ownerId: 1
    }
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

router.post('/api/saveToken', ensureAuthenticated, function (req, res, next) {
  var token = req.body.token;
  if (token) {
    models.tenant.create({
      name: 'auto',
      botKey: req.body.token
    }).then(function () {
      res.send('OK, saved token ' + token);
    }, err => {
      console.error("Error saving the token:");
      console.error(err);
    });
  } else {
    res.send('No token provided')
  }
});

router.get('/api/flow/:id', ensureAuthenticated, function (req, res, next) {
  // Returns the flow steps
  const SEND_DUMMY = false;

  if (!SEND_DUMMY) {
    // TODO filter the user; add attributes [] to filter columns
    models.step.findAll({
      where: {flowId: req.params.id},
      order: '"stepOrder"',
      include: [
        {model: models.step_choice}
      ]
    }).then(steps => {
      res.send({
        flowId: req.params.id,
        steps: steps
      });
    }, err => {
      console.error("Error fetching the flow steps:");
      console.error(err);
    });
  } else {
    // Dummy data
    res.send({
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

router.post('/api/flow/save', ensureAuthenticated, function (req, res, next) {
  console.log('Got');
  console.log(req.body);
  // TODO check this steps belongs to this flow and this flow belongs to the user requesting this
  req.body.steps.forEach(step => {
    models.step
      .update(
        {
          text: step.text,
        }, {where: {id: step.id}}
      )
      .then(result => {
        if (step.step_type === 4) {
          // Multiple choice
          // TODO: what if the user removed options? etc.
          step.step_choices.forEach(choice => {
            models.step_choice
              .update({
                  text: choice.text,
                  choiceOrder: choice.choiceOrder,
                }, {where: {id: choice.id}}
              )
              .then(result => {
                //
              }, err => {
                console.error("Error saving the step choice:");
                console.error(err);
              });
          });
        }
        // TODO: answer back
      }, err => {
        console.error("Error saving the step:");
        console.error(err);
      })
  });
});

// router.get('/api/flows', ensureAuthenticated, function (req, res, next) {
//   res.send(['first flow', 'second flow', 'third flow', 'fourth flow']);
// });

module.exports = router;