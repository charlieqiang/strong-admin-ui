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
      <el-table-column label="角色" align="center">
        <template slot-scope="{ row }">
          <el-tag
            v-for="role in row.roles"
            :key="role"
            style="margin-right: 5px"
          >
            {{ role }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="220">
        <template slot-scope="{ row }">
          <el-button
            type="primary"
            size="mini"
            @click="handleEdit(row)"
            style="margin-right: 10px"
          >
            编辑
          </el-button>
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
      <el-form
        :model="user"
        :rules="rules"
        ref="userForm"
        label-width="80px"
        label-position="left"
      >
        <el-form-item label="账号" prop="account">
          <el-input v-model="user.account" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="user.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item v-if="dialogType === 'new'" label="密码" prop="password">
          <el-input
            v-model="user.password"
            type="password"
            placeholder="请输入密码"
          />
        </el-form-item>
        <el-form-item
          v-if="dialogType === 'new'"
          label="确认密码"
          prop="confirmPassword"
        >
          <el-input
            v-model="user.confirmPassword"
            type="password"
            placeholder="请确认密码"
          />
        </el-form-item>
        <el-form-item label="角色" prop="roleIdList">
          <el-select
            v-model="user.roleIdList"
            placeholder="请选择角色"
            multiple
          >
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.code"
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
import { fetchList, addUser, deleteUser, updateUser } from '@/api/user'
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
        confirmPassword: '',
        roleIdList: []
      },
      rules: {
        account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 8, message: '密码长度不能小于8位', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                callback(new Error('密码必须包含大小写字母和数字'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ],
        confirmPassword: [
          { required: true, message: '请确认密码', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value !== this.user.password) {
                callback(new Error('两次输入的密码不一致'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ],
        roleIdList: [
          { required: true, message: '请选择角色', trigger: 'change' }
        ]
      },
      roles: []
    }
  },
  created() {
    this.getList()
    this.loadRoles()
  },
  methods: {
    loadRoles() {
      getRoles()
        .then(response => {
          if (response.code === 200) {
            this.roles = response.data
          }
        })
        .catch(error => {
          console.error('Failed to fetch roles:', error)
          this.$message.error('加载角色数据失败')
        })
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
      this.user = {
        account: '',
        username: '',
        password: '',
        confirmPassword: '',
        roleIdList: []
      }
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.dialogType = 'edit'
      this.user = {
        id: row.id,
        account: row.account,
        username: row.username,
        roleIdList: row.roles
          .map(roleName => {
            const role = this.roles.find(r => r.code === roleName)
            return role ? role.id : null
          })
          .filter(id => id !== null)
      }
      this.dialogVisible = true
    },
    async confirmUser() {
      const isEdit = this.dialogType === 'edit'
      try {
        await this.$refs.userForm.validate()
        if (isEdit) {
          await updateUser(this.user)
          this.dialogVisible = false
          this.getList()
        } else {
          await addUser(this.user)
          this.dialogVisible = false
          this.getList()
        }
        this.user = {
          account: '',
          username: '',
          password: '',
          confirmPassword: '',
          roleIdList: []
        }
      } catch (error) {
        console.error('表单验证失败:', error)
        return false
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
