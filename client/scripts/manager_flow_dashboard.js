"use strict";

var Highcharts = require('highcharts');

require('highcharts/modules/no-data-to-display')(Highcharts);
require('highcharts/modules/drilldown')(Highcharts);

// Load module after Highcharts is loaded
require('highcharts/modules/exporting')(Highcharts);

$(function () {
  //users
  Highcharts.chart('containerU', {
    lang: {
      noData: '<img class="illustration" src="../../../static/0.0.0/images/bot.svg"></img>' +
              '<h6 class="text-center"> No data to display!</h6>'
    },
    noData: {
      useHTML: true,
    },
    chart: {
      zoomType: 'xy',
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
    }],
    credits: {
      enabled: false
    }
  });

  Highcharts.chart('containerQ', {
    lang: {
      noData: '<img class="illustration" src="../../../static/0.0.0/images/bot.svg"></img>' +
              '<h6 class="text-center"> No data to display!</h6>'
    },
    noData: {
      useHTML: true,
    },
    credits: {
      enabled: false
    },
    chart: {
      type: 'column',
      zoomType: 'xy',
    },
    title: {
      text: 'Number of collected answers by question'
    },
    subtitle: {
      text: 'Click the columns to view details.'
    },
    xAxis: {
      type: 'category'
    },
    yAxis: {
      min: 0,
      max: app.totalUsers,
      tickInterval: 1,
      title: {
        text: 'Users'
      }
    },
    legend: {
      enabled: false
    },
    plotOptions: {
      series: {
        borderWidth: 0,
        dataLabels: {
          enabled: true,
          format: '{point.y}'
        }
      }
    },
    tooltip: {
      headerFormat: 'Question: <b>{series.name}</b><br>',
      pointFormat: 'Users: <b>{point.y}</b>'
    },
    series: app.answers,
    drilldown: {
      series: app.multipleChoices,
    }
  });
});

let app = new Vue({
    el: '#root',
    data: {
      answers : answersArray,
      users : usersArray,
      multipleChoices: stepChoiceArray,
      totalUsers: sumUsers,
    },
    methods:{

    }
});
