"use strict";

var Highcharts = require('highcharts');

// Load module after Highcharts is loaded
require('highcharts/modules/exporting')(Highcharts);

// Create the chart
//Highcharts.chart('container', { /*Highcharts options*/ });

$(function () {
  //users
  Highcharts.chart('containerU', {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie',
        margin: [30,0,30,0]
    },
    title: {
      text: 'Users Flow Status'
    },
    tooltip: {
      pointFormat: '{series.name}: {point.y}<br><b>{point.percentage:.1f}%</b>'
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: false
        },
        showInLegend: true
      }
    },
    series: [{
      name: 'Users',
      colorByPoint: true,
      data: app.users
    }]
  });

  Highcharts.chart('containerQ', {
    chart: {
      type: 'column',
    },
    title: {
      text: 'Number of collected answers by question'
    },
    xAxis: {
      categories: ['Questions'],
    },
    yAxis: {
      min: 0,
      max: app.totalUsers,
      minTickInterval: 1,
      title: {
        text: 'Users'
      }
    },
    legend: {
      layout: 'vertical',
      floating: false,
      verticalAlign: 'bottom',
    },
    tooltip: {
    headerFormat: 'Question: <b>{series.name}</b><br>',
    pointFormat: 'Users: <b>{point.y}</b>'
    },
    series: app.answers
  });
});

let app = new Vue({
    el: '#root',
    data: {
      answers : answersArray,
      users : usersArray,
      totalUsers: sumUsers,
      totalAnswered: sumAnswered,
      totalAnswers: allAnswers,
    },
    methods:{

    }
});
