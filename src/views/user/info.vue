<template>
  <div class="app-container">
    <el-button type="primary" @click="handleAddUser"> 添加用户 </el-button>

    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%; margin-top: 30px"
    >
      <el-table-column label="账号" prop="account" align="center">
        <template slot-scope="{ row }">
          <span>{{ row.account }}</span>
        </template>
      </el-table-column>
      <el-table-column label="用户名" prop="username" align="center">
        <template slot-scope="{ row }">
          <span>{{ row.username }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150">
        <template slot-scope="{ row }">
          <el-button type="danger" size="mini" @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="page.pageNum"
      :limit.sync="page.pageSize"
      @pagination="getList"
    />

    <el-dialog
      :visible.sync="dialogVisible"
      :title="dialogType === 'edit' ? '编辑用户' : '新增用户'"
    >
      <el-form :model="user" label-width="80px" label-position="left">
        <el-form-item label="账号">
          <el-input v-model="user.account" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="user.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="user.password"
            placeholder="请输入密码"
            type="password"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select
            v-model="user.roleIdList"
            placeholder="请选择角色"
            @visible-change="handleRoleDropdown"
            :loading="roleLoading"
            loading-text="加载中..."
            multiple
          >
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div style="text-align: right">
        <el-button type="danger" @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="confirmUser"> 确定 </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { fetchList, addUser, deleteUser } from '@/api/user'
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
        this.roleLoading = true
        try {
          const response = await getRoles()
          if (response.code === 200) {
            this.roles = response.data
          }
        } catch (error) {
          console.error('Failed to fetch roles:', error)
        } finally {
          this.roleLoading = false
        }
      }
    },
    async getList() {
      this.listLoading = true
      fetchList(this.listQuery, this.page)
        .then(response => {
          this.list = response.data.content
          this.total = response.data.totalSize
          this.listLoading = false
        })
        .catch(() => {
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
        this.user = { account: '', username: '', password: '', roleIdList: [] }
        this.dialogVisible = false
        this.getList()
      }
    },
    handleDelete(row) {
      this.$confirm('确认删除该用户吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          deleteUser(row.id)
            .then(response => {
              if (response.code === 200) {
                this.$message({
                  type: 'success',
                  message: '删除成功!'
                })
                this.getList()
              } else {
                this.$message({
                  type: 'error',
                  message: response.message || '删除失败'
                })
              }
            })
            .catch(() => {
              this.$message({
                type: 'error',
                message: '删除失败'
              })
            })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
    }
  }
}
</script>
