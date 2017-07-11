"use strict";

import {Vuetable, VuetablePagination,VuetablePaginationInfo} from 'vuetable-2/dist/vuetable-2-full'
import VueEvents from 'vue-events'

Vue.use(VueEvents)
Vue.use(Vuetable)
Vue.use(VuetablePagination)
Vue.use(VuetablePaginationInfo)

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
                name:'username',
                title: "Username",
                sortField: '"respondent_flow.respondent".name',
            },
            {
                name:'date',
                title: 'Date',
                sortField: 'answer_date'
            },
            {
                name:'question_num',
                title: '#',
                sortField: 'step.step_order'
            },
            'question',
            {
                name:'answer',
                title:'Answer',
                callback: 'makeClickable'
            }
        ],
        moreParams: {},
        css: {
            tableClass: 'table table-striped table-bordered',
            loadingClass: 'loading',
            ascendingIcon: 'fa fa-sort-amount-asc',
            descendingIcon: 'fa fa-sort-amount-desc',
            sortHandleIcon: 'fa fa-bars'
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
        makeClickable: function(value) {
            if(value.includes("http"))
                return '<a href="'+value+'">'+value+'</a>';
            return value;
        },
        onClick (event) {
            console.log('my-detail-row: on-click', event.target)
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
            Vue.nextTick( () => this.$refs.vuetable.refresh());
        },
        onFilterReset () {
            this.moreParams = {};
            Vue.nextTick( () => this.$refs.vuetable.refresh());
        }
    }
});