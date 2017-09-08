"use strict";

const c3 = require('c3');

let app = new Vue({
  el: '#root',
  data: {
    answers: answersObj,
    answersCategories: answersCatObj,
    users: usersObj,
    multipleChoices: stepChoiceObj,
    multipleChoicesCat: stepChoiceCatObj,
    totalUsers: sumUsers,
  },
  mounted: function() {
    c3.generate({
      bindto: '#pieChart',
      data: {
        columns: this.users,
        type: 'pie',
      },
      title: {
        text: 'Users Flow Status'
      },
      zoom: {
        enabled: true
      },
      empty: {
        label: {
          text: "No Data"
        }
      },
      /*color: {
      pattern: ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5']
      }*/
    });
  },
  methods: {

  }
});

let onLoad = false;

console.log(">> ANSWERS <<");
console.log(app.answers);

let chart = c3.generate({
  bindto: '#questionsChart',
  data: {
    columns: [app.answers],
    type: 'bar',
    color: function(inColor, data) {
      let pattern = ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'];
      if (data.index !== undefined) {
        return pattern[data.index];
      }
      return inColor;
    },
    onclick: function(d, element) {
      if (typeof app.multipleChoices[d.index] !== 'undefined' && app.multipleChoices[d.index] !== null && !onLoad) {

        d3.select('#back').style("display", "block");

        onLoad = true;
        chart.load({
          unload: app.answers[0],
          columns: [
            app.multipleChoices[d.index]
          ],
          categories: app.multipleChoicesCat[d.index]
        });
      }
    },
  },
  legend: {
    hide: true
  },
  zoom: {
    enabled: false
  },
  bar: {
    width: {
      ratio: 0.8
    }
  },
  axis: {
    x: {
      type: 'category',
      categories: app.answersCategories,
      label: {
        text: 'Answers',
        position: 'outer-center'
      }
    }
  },
  title: {
    text: 'Number of collected answers by question'
  },
});

d3.select('#back').on('click', function(d, element) {
  if (onLoad) {
    d3.select('#back').style("display", "none");
    onLoad = false;
    chart.load({
      unload: true,
      columns: [app.answers],
      categories: app.answersCategories
    });
  }
});