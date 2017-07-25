"use strict";

import {Vuetable, VuetablePagination, VuetablePaginationInfo} from 'vuetable-2/dist/vuetable-2-full'
import VueEvents from 'vue-events'

Vue.use(VueEvents)
Vue.use(Vuetable)
Vue.use(VuetablePagination)
Vue.use(VuetablePaginationInfo)

Vue.component('DetailRow', {
  props: {
    rowData: {
      type: Object,
      required: false
    },
    rowIndex: {
      type: Number
    }
  },
  template:
    '<div @click="onClick"> ' +
      '<div v-for="detail in rowData.details"> ' +
        '<div><p>' +
          '<strong>{{detail.question_num}} : {{detail.question}} </strong> ' +
          '<i class="text-muted"> {{detail.answer_date}}</i>' +
        '</p></div> ' +
        '<div v-if="isLink(detail.answer)">' +
          '<p><a v-bind:href="detail.answer">Document Link</a> to access via your manager Google Drive account</p>' +
        '</div> '+
        '<div v-else>' +
          '<p>{{detail.answer}}</p>' +
        '</div> '+
      '</div>' +
    '</div>',
  methods:{
    onClick (event) {
      console.log('my-detail-row: on-click', event.target)
    },
    isLink: function (value) {
      console.log(value)
      return value.includes('http');
    },
  }
});

let app = new Vue({
  el: '#app',
  components: {
    Vuetable,
    VuetablePagination,
    VuetablePaginationInfo,
  },
  data: {
    filterText: '',
    fields: [
      {
        name: '__handle',
      },
      {
        name: 'username',
        title: "Username",
        sortField: '"respondent.name"',
      },
      {
        name: 'status',
        title: "Status",
        sortField: '"respondent_flow_status.description"',
      },
      {
        name: 'start_date',
        title: "Start date",
        sortField: '"start_date"' ,
      },
      {
        name: 'end_date',
        title: "End Date",
        sortField: '"end_date"',
      },
    ],
    sortOrder: [
        {
          field: 'username',
          sortField: '"respondent.name"',
          direction: 'asc'
        },
        {
          field: 'status',
          sortField: '"respondent_flow_status.description"',
          direction: 'asc'
        },
        {
          field: 'start_date',
          sortField: '"start_date"' ,
          direction: 'asc'
        },
        {
          field: 'end_date',
          sortField: '"end_date"',
          direction: 'asc'
        },
    ],
    css: {
      tableClass: 'table table-bordered',
      loadingClass: 'loading',
      ascendingIcon: 'fa fa-sort-amount-asc',
      descendingIcon: 'fa fa-sort-amount-desc',
      handleIcon: 'fa fa-chevron-right',//'fa fa-caret-square-o-down',
      detailRowClass: 'detail',
    },
    cssPagination: {
      infoClass: 'pull-left',
      wrapperClass: 'vuetable-pagination pull-right',
      activeClass: 'btn-primary',
      disabledClass: 'disabled',
      pageClass: 'btn btn-border',
      linkClass: 'btn btn-border',
      icons: {
        first: '',
        prev: '',
        next: '',
        last: '',
      }
    },
  },
  mounted () {
    this.$events.$on('filter-set', eventData => this.onFilterSet(eventData));
    this.$events.$on('filter-reset', e => this.onFilterReset());
  },

  methods: {
    closeAllDetailRows (){
      console.log("Closing detail rows");
      let rows = this.$refs.vuetable.visibleDetailRows;
      let length = rows.length;

      for(let i = 0; i < length; i++){
        this.closeDetailRow(rows[0]);
      }

    },
    closeDetailRow (id){
      //change icon
      $('tr[item-index="'+id+'"]')
          .children('td.vuetable-handle')
          .children('i')
          .removeClass('fa-chevron-down')
          .addClass('fa-chevron-right');
      this.$refs.vuetable.hideDetailRow(id);
    },
    onCellClicked (data, field, event) {
      console.log('cellClicked: '+ data.id);

      if(this.$refs.vuetable.isVisibleDetailRow(data.id)){
        this.closeDetailRow(data.id);
      }
      //show detail row
      else
      {
        //change icon
        $('tr[item-index="'+data.id+'"]')
            .children('td.vuetable-handle')
            .children('i')
            .removeClass('fa-chevron-right')
            .addClass('fa-chevron-down');

        //no data detail
        if(data.details === null)
        {
          //ajax
          this.$http.get('/test/answers/'+flowId+'/'+data.resp_id).then(response => {
            data.details = response.body;
            this.$refs.vuetable.toggleDetailRow(data.id);
          }, error => {
            if (error.status === 401) {
              window.location.replace('/auth/spark');
            }
          });
        }
        else{
          this.$refs.vuetable.toggleDetailRow(data.id);
        }
      }
    },
    onPaginationData (paginationData) {
      this.$refs.pagination.setPaginationData(paginationData);
      this.$refs.paginationInfo.setPaginationData(paginationData);
    },
    onChangePage (page) {
      this.$refs.vuetable.changePage(page);
    },
    doFilter () {
      this.$events.fire('filter-set', this.filterText);
    },
    resetFilter () {
      this.filterText = '';
      this.$events.fire('filter-reset');
    },
    onFilterSet (filterText) {
      this.moreParams = {
        'filter': filterText
      };
      Vue.nextTick(() => this.$refs.vuetable.refresh());
    },
    onFilterReset () {
      this.moreParams = {};
      Vue.nextTick(() => this.$refs.vuetable.refresh());
    },
    exportCSV () {
      window.location.replace('/test/export/'+flowId);
    }
  }
});