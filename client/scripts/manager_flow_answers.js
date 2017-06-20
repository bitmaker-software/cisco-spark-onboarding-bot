"use strict";

let app = new Vue({
  el: '#root',
  data: {
    answers: [],
  },
  methods: {
    showAnswers: () => {
      app.answers = [
        {id: 123, stepId: 1, text: "My first answer.", answerDate: new Date()},
        {id: 124, stepId: 2, text: "My second answer.", answerDate: new Date()},
        {id: 125, stepId: 3, text: "My third answer.", answerDate: new Date()},
        {id: 126, stepId: 4, text: "My fourth answer.", answerDate: new Date()},
        {id: 127, stepId: 5, text: "My fifth answer.", answerDate: new Date()},
        {id: 128, stepId: 6, text: "My sixth answer.", answerDate: new Date()},
      ];
    }
  }
});