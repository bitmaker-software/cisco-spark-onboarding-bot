"use strict";

let app = new Vue({
  el: '#root',
  data: {
    answers: [],
    maxPages: 0,
    maxPerPage: 5,
  },

  methods: {
    showAnswers: (page) => {

        //mudar isto para fazer pedidos a bd?

        if(page == 1){
            app.answers = [
                {id: 123, stepId: 1, text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." +
                "Morbi tellus purus, pellentesque at erat quis, volutpat molestie neque. " +
                "Morbi convallis volutpat mi, id scelerisque odio dapibus nec. Vestibulum interdum nulla eu iaculis maximus. " +
                "Fusce feugiat malesuada enim, eu posuere sapien. " +
                "Ut id elit sapien. Nullam orci tortor, elementum sed sapien vel, dignissim luctus odio.", answerDate: new Date()},
                {id: 124, stepId: 2, text: "My second answer.", answerDate: new Date()},
                {id: 125, stepId: 3, text: "My third answer.", answerDate: new Date()},
                {id: 126, stepId: 4, text: "My fourth answer.", answerDate: new Date()},
                {id: 127, stepId: 5, text: "My fifth answer.", answerDate: new Date()},
            ];
        }
        else{
            app.answers = [
                {id: 128, stepId: 6, text: "My sixth answer.", answerDate: new Date()},
            ];
        }

      app.maxPages = Math.ceil(app.answers.length / app.maxPerPage);
    },

    doSearch(text){
        alert("search!");
    },

    order(text){
        alert("order "+text);
    }
  }

});