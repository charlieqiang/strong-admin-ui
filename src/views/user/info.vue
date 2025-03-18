<template>
    <div class="app-container">
        <el-table :key="tableKey" v-loading="listLoading" :data="list" border fit highlight-current-row
            style="width: 100%;">
            <el-table-column label="Account" prop="account" sortable="custom" align="center">
                <template slot-scope="{row}">
                    <span>{{ row.account }}</span>
                </template>
            </el-table-column>
            <el-table-column label="Username" prop="name" sortable="custom" align="center">
                <template slot-scope="{row}">
                    <span>{{ row.name }}</span>
                </template>
            </el-table-column>
        </el-table>

        <pagination v-show="total > 0" :total="total" :page.sync="page.pageNum" :limit.sync="page.pageSize"
            @pagination="getList" />
    </div>
</template>

<script>
import { fetchList } from '@/api/user'
import Pagination from '@/components/Pagination'

export default {
    name: 'UserInfo',
    components: { Pagination },
    data() {
        return {
            tableKey: 0,
            list: null,
            total: 0,
            listLoading: true,
            listQuery: {
                account: '',
                username: ''
            },
            page: {
                pageNum: 1,
                pageSize: 20
            }
        }
    },
    created() {
        this.getList()
    },
    methods: {
        getList() {
            this.listLoading = true
            fetchList(this.listQuery, this.page).then(response => {
                this.list = response.data.content
                this.total = response.data.totalSize
                this.listLoading = false
            }).catch(() => {
                this.listLoading = false
            })
        }
    }
}
</script>