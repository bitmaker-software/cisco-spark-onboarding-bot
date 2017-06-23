"use strict";

const express = require('express');
const router = express.Router();

/* POST webhooks. */
router.post('/', function (req, res, next) {
  const token = req.body.token;
  let response;
  if (token) {
    response = {
      id: req.body.id,
      date: new Date()
    }
  } else {
    response = "Invalid token."
  }
  res.send(response);
});

module.exports = router;