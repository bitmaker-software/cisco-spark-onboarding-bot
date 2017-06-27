"use strict";

import ElementUI from 'element-ui'
import DataTables from 'vue-data-tables'

Vue.use(ElementUI);
Vue.use(DataTables);

import lang from 'element-ui/lib/locale/lang/en'
import locale from 'element-ui/lib/locale'
locale.use(lang)

let app = new Vue({
    el: '#root',
    components: {
        DataTables,
        ElementUI
    },
    data: {
        answers: answersArray,
    },
    methods: {
        getSearchDef() {
            return {
                placeholder: 'please input searchkey',
            }
        },
        getPaginationDef() {
            return {
                layout: 'total, prev, pager, next, jumper, sizes',
                pageSize: 10,
                pageSizes: [10, 20, 50],
            }
        }
    },
});