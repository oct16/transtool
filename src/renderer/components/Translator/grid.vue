<template>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th :key="index" v-for="(key, index) of columns" @click="sortBy(key)" :class="{ active: sortKey == key, 'is-key': key === 'key' }">
                    {{ key | capitalize }}
                    <span class="arrow" :class="sortOrders[key] > 0 ? 'asc' : 'dsc'">
                    </span>
                </th>
            </tr>
        </thead>
        <tbody>
            <tr @click="onSelect($event, entry, index)" :class="isRowActive(entry)" :key="index" v-for="(entry,index) of filteredData">
                <td :class="{'is-modify': isModify(entry), 'is-modify-after-init': isModifyAfterInit(entry)}" class="col-index">{{ index + 1}}</td>
                <td :key="index" v-for="(key,index) of columns">
                    <input type="text" :class="isRowEmpty(entry[key])" class="form-control" v-model="entry[key]">
                    <span class="col-count" v-if="key === 'key'">{{ filesKeys[entry[key]]}}</span>
                </td>
            </tr>
        </tbody>
    </table>
</template>

<script>
export default {
    name: 'trans-grid',
    props: {
        data: Array,
        pristineData: Object,
        fileInitData: Object,
        columns: Array,
        filterKey: String
    },
    data() {
        return {
            sortKey: '',
            sortOrders: {},
            filteredData: null,
            activeRows: [],
            preFilterKey: null,
            indexer: {}
        }
    },
    computed: {
        filesKeys() {
            return this.$store.state.base.filesKeys
        },
        isChanged() {
            if (!this.pristineData || !this.data || !this.data.length) {
                return false
            }
            if (Object.keys(this.pristineData).length !== this.data.length) {
                return true
            }
            const isChanged = this.data.some(item => {
                return this.compare(item)
            })
            if (isChanged) {
                return true
            }
            return false
        },
        isSorted() {
            return (this.sortKey && this.sortOrders[this.sortKey] !== 1)
        }
    },
    watch: {
        columns() {
            var sortOrders = {}
            this.columns.forEach(function(key) {
                sortOrders[key] = 1
            })
            this.sortOrders = sortOrders
        },
        data() {
            this.sort()
            this.updateIndexer()
        },
        sortKey() {
            this.sort()
        },
        filterKey() {
            this.sort()
        },
        filteredData() {
            this.activeRows = []
        }
    },
    filters: {
        capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1)
        }
    },
    methods: {
        isRowEmpty(val) {
            return val === '' ? 'border-danger' : ''
        },
        isRowActive(item) {
            let index = this.findIndexFaster(item)
            let findIndex = this.activeRows.find(rowIndex => rowIndex === index)
            return findIndex || findIndex === 0 ? 'active' : ''
        },
        compare(obj) {
            const key = obj.key
            const pristine = this.pristineData[key]
            if (pristine) {
                if (JSON.stringify(pristine) === JSON.stringify(obj)) {
                    return false
                }
            }
            return true
        },
        compareByInit(obj) {
            const key = obj.key
            const data = this.fileInitData[key]
            if (data) {
                if (JSON.stringify(data) === JSON.stringify(obj)) {
                    return false
                }
            }
            return true
        },
        isModify(obj) {
            return this.compare(obj)
        },
        isModifyAfterInit(obj) {
            return this.compareByInit(obj)
        },
        updateIndexer() {
            const map = {}
            this.data.forEach((item, index) => {
                map[item.hash] = index
            })
            this.indexer = map
        },
        findIndexFaster(item) { // faster then @findIndex method 10X
            return this.indexer[item.hash]
        },
        findIndex(item) {
            const key = item.key
            return this.data.findIndex(el => el.hash ? el.hash === item.hash : el.key === key)
        },
        findSortDataIndex(item) {
            const key = item.key
            return this.filteredData.findIndex(el => el.hash ? el.hash === item.hash : el.key === key)
        },
        onSelect(event, item, rowIndex) {
            let index = this.findIndexFaster(item)
            if (event.altKey) {
                const findIndex = this.activeRows.indexOf(index)
                if (~findIndex) {
                    this.activeRows.splice(findIndex, 1)
                } else {
                    this.activeRows = Array.from(new Set(this.activeRows.concat(index)))
                }
            } else if (event.shiftKey && this.activeRows.length) {
                let supplement
                let min = Math.min.apply(null, this.activeRows)
                let max = Math.max.apply(null, this.activeRows)
                if (this.isSorted) {
                    let SortedMin = this.findSortDataIndex(this.data[min])
                    let SortedMax = this.findSortDataIndex(this.data[max])
                    if (rowIndex < SortedMin) {
                        const distance = SortedMin - rowIndex
                        supplement = new Array(distance).fill(0).map(() => this.findIndexFaster(this.filteredData[--SortedMin]))
                    } else if (rowIndex > SortedMax) {
                        const distance = rowIndex - SortedMax
                        supplement = new Array(distance).fill(0).map(() => this.findIndexFaster(this.filteredData[++SortedMax]))
                    } else if (rowIndex < SortedMax && rowIndex > SortedMin) {
                        const distance = SortedMax - SortedMin
                        supplement = new Array(distance).fill(0).map(() => this.findIndexFaster(this.filteredData[++SortedMin]))
                    }
                } else {
                    if (index < min) {
                        const distance = min - index
                        supplement = new Array(distance).fill(0).map(() => --min)
                    } else if (index > max) {
                        const distance = index - max
                        supplement = new Array(distance).fill(0).map(() => ++max)
                    } else if (index < max && index > min) {
                        const distance = max - min
                        supplement = new Array(distance).fill(0).map(() => ++min)
                    }
                }
                this.activeRows = Array.from(new Set(this.activeRows.concat(supplement)))
            } else {
                this.activeRows = [index] // if wanna cancel selection, press key [Alt]
            }
            this.$emit('onSelect', this.activeRows)
        },
        cleanSelects() {
            this.$emit('onSelect', this.activeRows = [])
        },
        sortBy(key) {
            this.sortKey = key
            switch (this.sortOrders[key]) {
            case 1:
                this.sortOrders[key] = -1
                break
            case -1:
                this.sortOrders[key] = 0
                break
            default:
                this.sortOrders[key] = 1
                this.sortKey = ''
                break
            }
            this.sort()
        },
        sort() {
            var sortKey = this.sortKey
            var filterKey = this.filterKey && this.filterKey.toLowerCase()
            var order = this.sortOrders[sortKey] || 1
            var data = this.data
            const isEqualPre = this.preFilterKey === filterKey
            if (filterKey) {
                const filterKeys = filterKey.split(' ').filter(val => !!val)
                data = data.filter(row => {
                    return Object.keys(row).some(key => {
                        return (
                            (row.isNew && isEqualPre) ||
                            filterKeys.every(fKey => {
                                return String(row[key])
                                    .toLowerCase()
                                    .indexOf(fKey) > -1
                            })

                        )
                    })
                })
            }

            if (!isEqualPre) {
                data.forEach(row => {
                    if (row.isNew) {
                        row.isNew = false
                    }
                })
                this.preFilterKey = filterKey
            }

            if (sortKey) {
                data = data.slice().sort((a, b) => {
                    a = a[sortKey]
                    b = b[sortKey]
                    return (a === b ? 0 : a > b ? 1 : -1) * order
                })
            }
            this.filteredData = data
        }
    }
}
</script>

<style>
table {
    background-color: #f9f9f9;
    width: 100%;
}

th {
    border-bottom: 1px solid #ebedf0;
    background-color: #f9f9f9;
    color: darkgrey;
    cursor: pointer;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

td > input {
    font-size: 11px !important;
}

th,
td {
    min-width: 60px;
    padding: 4px 10px;
    position: relative;
}

th.is-key {
    min-width: 250px;
    max-width: 400px;
}

tr.active {
    background: rgb(224, 224, 224);
}

.col-index {
    cursor: pointer;
    width: 20px;
    text-align: center;
    font-size: 12px;
}

.col-count {
    color: #adadad;
    position: absolute;
    right: 13px;
    bottom: 3px;
    font-size: 10px;
}

th.active {
    color: darkolivegreen;
}

th.active .arrow {
    opacity: 1;
}

.arrow {
    display: inline-block;
    vertical-align: middle;
    width: 0;
    height: 0;
    margin-left: 5px;
    opacity: 0.66;
}

.arrow.asc {
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-bottom: 4px solid darkolivegreen;
}

.arrow.dsc {
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid darkolivegreen;
}

.is-modify:before {
    content: '';
    position: absolute;
    top: 0px;
    left: 0px;
    display: block;
    width: 5px;
    height: 100%;
    background: rgb(19, 192, 30);
    z-index: 1;
}

.is-modify-after-init:after {
    content: '';
    position: absolute;
    top: 0px;
    left: 0px;
    display: block;
    width: 5px;
    height: 100%;
    background: rgb(0, 94, 255);
}
</style>
