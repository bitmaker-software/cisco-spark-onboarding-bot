"use strict";

var c3 = require('c3');

let app = new Vue({
  el: '#root',
  data: {
    answers: answersObj,
    answersCategories: answersCatObj,
    users: usersObj,
    multipleChoices: stepChoiceObj,
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
      if (typeof app.multipleChoices[d.index] !== 'undefined' && !onLoad) {

        d3.select('#back').style("display", "block");

        onLoad = true;
        chart.load({
          unload: app.answers[0],
          columns: app.multipleChoices[d.index]
        });
      }
    },
  },
  legend: {
    hide: true
  },
  zoom: {
    enabled: true
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
    });
    console.log(app.answers);
  }
});

/*
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
*/