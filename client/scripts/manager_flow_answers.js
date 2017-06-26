"use strict";

let app = new Vue({
  el: '#root',
  data: {
    answers: answersArray,
    maxPages: 0,
    maxPerPage: 5,
  },

  methods: {

    totalAnswers: () => {
        //ir buscar a bd o numero total de answers repondidas
        app.maxPages = Math.ceil(app.answers.length / app.maxPerPage);
    },

    showAnswers: (page) =>
    {
        /*
        app.$http.get('/test/search_users/' + searchString).then(response => {
            app.searchResultsInfo = `Found ${response.body.length} result(s).`;
            app.searchResults = response.body;
        }, error => {
            if (error.status === 401) {
                window.location.replace('/auth/spark');
            }
        });
        */
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