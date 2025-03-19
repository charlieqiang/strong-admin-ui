<template>
    <div class="app-container">
        <el-button type="primary" @click="handleAddUser">
            Add User
        </el-button>

        <el-table :key="tableKey" v-loading="listLoading" :data="list" border fit highlight-current-row
            style="width: 100%;margin-top:30px;">
            <el-table-column label="Account" prop="account" sortable="custom" align="center">
                <template slot-scope="{row}">
                    <span>{{ row.account }}</span>
                </template>
            </el-table-column>
            <el-table-column label="Username" prop="username" sortable="custom" align="center">
                <template slot-scope="{row}">
                    <span>{{ row.username }}</span>
                </template>
            </el-table-column>
        </el-table>

        <pagination v-show="total > 0" :total="total" :page.sync="page.pageNum" :limit.sync="page.pageSize"
            @pagination="getList" />

        <el-dialog :visible.sync="dialogVisible" :title="dialogType === 'edit' ? 'Edit User' : 'New User'">
            <el-form :model="user" label-width="80px" label-position="left">
                <el-form-item label="Account">
                    <el-input v-model="user.account" placeholder="User Account" />
                </el-form-item>
                <el-form-item label="Name">
                    <el-input v-model="user.username" placeholder="User Name" />
                </el-form-item>
                <el-form-item label="Password">
                    <el-input v-model="user.password" placeholder="User Password" type="password" />
                </el-form-item>
                <el-form-item label="Role">
                    <el-select v-model="user.roleIdList" placeholder="Select Role" @visible-change="handleRoleDropdown"
                        :loading="roleLoading" loading-text="Loading..." multiple>
                        <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
                    </el-select>
                </el-form-item>
            </el-form>
            <div style="text-align:right;">
                <el-button type="danger" @click="dialogVisible = false">
                    Cancel
                </el-button>
                <el-button type="primary" @click="confirmUser">
                    Confirm
                </el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { fetchList, addUser } from '@/api/user'
import { getRoles } from '@/api/permission'
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
            },
            dialogVisible: false,
            dialogType: 'new',
            user: {
                account: '',
                username: '',
                password: '',
                roleIdList: []
            },
            roles: [],
            roleLoading: false
        }
    },
    created() {
        this.getList()
    },
    methods: {
        async handleRoleDropdown(visible) {
            // 避免重复请求
            if (visible && this.roles.length === 0) {
                this.roleLoading = true;
                try {
                    const response = await getRoles();
                    if (response.code === 200) {
                        this.roles = response.data;
                    }
                } catch (error) {
                    console.error('Failed to fetch roles:', error);
                } finally {
                    this.roleLoading = false;
                }
            }
        },
        async getList() {
            this.listLoading = true
            fetchList(this.listQuery, this.page).then(response => {
                this.list = response.data.content
                this.total = response.data.totalSize
                this.listLoading = false
            }).catch(() => {
                this.listLoading = false
            })
        },
        handleAddUser() {
            this.dialogType = 'new'
            this.dialogVisible = true
        },
        async confirmUser() {
            const isEdit = this.dialogType === 'edit'

            if (isEdit) {

            } else {
                const { data } = await addUser(this.user)
                this.user = { account: '', username: '', password: '', roleIdList: [] };
                this.dialogVisible = false
                this.getList()
            }
        },
    }
}
</script>