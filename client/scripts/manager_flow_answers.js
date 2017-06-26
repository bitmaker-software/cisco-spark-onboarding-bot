"use strict";

let app = new Vue({
  el: '#root',
  data: {
    answers: [],
    maxPages: 2,
    maxPerPage: 3,
    flowId: flowId
  },

  methods: {

    totalAnswers: () => {
        //app.maxPages = Math.ceil(app.answers.length / app.maxPerPage);
    },

    correctAnswers: (raw_answers) => {

      var answersArray = raw_answers.body;

      console.log(answersArray);

      for(var i = 0; i < answersArray.length; i++)
      {
        //data apresentavel
        var date = answersArray[i].answer_date + "";
        answersArray[i].answer_date = date.substring(0, 10);

        //colocar a resposta de acordo com o que recebe
        var stepType = answersArray[i].step.step_type_id;

        if (stepType == 2) {
          answersArray[i].answer = answersArray[i].text;
        } else if (stepType == 3) {
          answersArray[i].answer = answersArray[i].document_url;
        } else if (stepType == 4) {
          answersArray[i].answer =
            answersArray[i].step_choice.choice_order + " : " +
            answersArray[i].step_choice.text;
        }
      }
      app.answers = answersArray;
    },

    showAnswers: (page) =>
    {
      var page = page-1;
      app.$http.get('/test/answers_page/'+flowId+'/'+page+'/'+app.maxPerPage).then(response => {
        app.correctAnswers(response);
      }, error => {
        if (error.status === 401) {
          window.location.replace('/auth/spark');
        }
      });
    },

    doSearch(text){
        alert("search!");
    },

    order(text){
        alert("order "+text);
    }
  }
});
app.totalAnswers();
app.showAnswers(1);