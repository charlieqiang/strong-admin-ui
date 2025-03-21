<template>
  <div class="app-container">
    <el-button type="primary" @click="handleAddRole"> 添加角色 </el-button>

    <el-table
      v-loading="listLoading"
      :data="rolesList"
      style="width: 100%; margin-top: 30px"
      border
    >
      <el-table-column align="center" label="角色编码" width="220">
        <template slot-scope="scope">
          {{ scope.row.code }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="角色名称" width="220">
        <template slot-scope="scope">
          {{ scope.row.name }}
        </template>
      </el-table-column>
      <el-table-column align="header-center" label="描述">
        <template slot-scope="scope">
          {{ scope.row.description }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作">
        <template slot-scope="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope)">
            编辑权限
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      :visible.sync="dialogVisible"
      :title="dialogType === 'edit' ? '编辑角色' : '新增角色'"
    >
      <el-form :model="role" label-width="80px" label-position="left">
        <el-form-item label="名称">
          <el-input v-model="role.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="编码">
          <el-input v-model="role.code" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="role.description"
            :autosize="{ minRows: 2, maxRows: 4 }"
            type="textarea"
            placeholder="请输入角色描述"
          />
        </el-form-item>
        <el-form-item label="菜单">
          <el-tree
            ref="tree"
            :check-strictly="checkStrictly"
            :data="routesData"
            :props="defaultProps"
            show-checkbox
            node-key="path"
            class="permission-tree"
          />
        </el-form-item>
      </el-form>
      <div style="text-align: right">
        <el-button type="danger" @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="confirmRole"> 确定 </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import path from 'path'
import { deepClone } from '@/utils'
import {
  getRoutes,
  getRoles,
  addRole,
  deleteRole,
  updateRole
} from '@/api/permission'

const defaultRole = {
  code: '',
  name: '',
  description: '',
  routes: []
}

export default {
  data() {
    return {
      role: Object.assign({}, defaultRole),
      routes: [],
      rolesList: [],
      dialogVisible: false,
      dialogType: 'new',
      checkStrictly: false,
      defaultProps: {
        children: 'children',
        label: 'title'
      },
      listLoading: true
    }
  },
  computed: {
    routesData() {
      return this.routes
    }
  },
  created() {
    this.getList()
  },
  methods: {
    async getList() {
      this.listLoading = true
      await Promise.all([this.getRoutes(), this.getRoles()])
      this.listLoading = false
    },
    async getRoutes() {
      const res = await getRoutes()
      this.serviceRoutes = res.data
      this.routes = res.data
    },
    async getRoles() {
      const res = await getRoles()
      this.rolesList = res.data
    },
    generateArr(routes) {
      let data = []
      routes.forEach(route => {
        data.push(route)
        if (route.children) {
          const temp = this.generateArr(route.children)
          if (temp.length > 0) {
            data = [...data, ...temp]
          }
        }
      })
      return data
    },
    handleAddRole() {
      this.role = Object.assign({}, defaultRole)
      if (this.$refs.tree) {
        this.$refs.tree.setCheckedNodes([])
      }
      this.dialogType = 'new'
      this.dialogVisible = true
    },
    handleEdit(scope) {
      this.dialogType = 'edit'
      this.dialogVisible = true
      this.checkStrictly = true
      this.role = deepClone(scope.row)
      this.$nextTick(() => {
        const routes = this.role.routes
        this.$refs.tree.setCheckedNodes(this.generateArr(routes))
        // set checked state of a node not affects its father and child nodes
        this.checkStrictly = false
      })
    },
    handleDelete({ $index, row }) {
      this.$confirm('确认删除该角色吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          await deleteRole(row.id)
          this.rolesList.splice($index, 1)
          this.$message({
            type: 'success',
            message: '删除成功！'
          })
        })
        .catch(err => {
          console.error(err)
        })
    },
    generateTree(routes, basePath = '/', checkedKeys) {
      const res = []

      for (const route of routes) {
        const routePath = path.resolve(basePath, route.path)

        // recursive child routes
        if (route.children) {
          route.children = this.generateTree(
            route.children,
            routePath,
            checkedKeys
          )
        }

        if (
          checkedKeys.includes(routePath) ||
          (route.children && route.children.length >= 1)
        ) {
          res.push(route)
        }
      }
      return res
    },
    async confirmRole() {
      const isEdit = this.dialogType === 'edit'

      const checkedKeys = this.$refs.tree.getCheckedKeys()
      this.role.routes = this.generateTree(
        deepClone(this.serviceRoutes),
        '/',
        checkedKeys
      )

      if (isEdit) {
        await updateRole(this.role)
        for (let index = 0; index < this.rolesList.length; index++) {
          if (this.rolesList[index].code === this.role.code) {
            this.rolesList.splice(index, 1, Object.assign({}, this.role))
            break
          }
        }
      } else {
        const { data } = await addRole(this.role)
        this.role.code = data.code
        this.role.id = data.id
        this.rolesList.push(this.role)
      }

      const { description, code, name } = this.role
      this.dialogVisible = false
      this.$notify({
        title: '成功',
        dangerouslyUseHTMLString: true,
        message: `
            <div>角色编码: ${code}</div>
            <div>角色名称: ${name}</div>
            <div>描述: ${description}</div>
          `,
        type: 'success'
      })
    },
    // reference: src/view/layout/components/Sidebar/SidebarItem.vue
    onlyOneShowingChild(children = [], parent) {
      let onlyOneChild = null
      const showingChildren = children.filter(item => !item.hidden)

      // When there is only one child route, the child route is displayed by default
      if (showingChildren.length === 1) {
        onlyOneChild = showingChildren[0]
        onlyOneChild.path = path.resolve(parent.path, onlyOneChild.path)
        return onlyOneChild
      }

      // Show parent if there are no child route to display
      if (showingChildren.length === 0) {
        onlyOneChild = { ...parent, path: '', noShowingChildren: true }
        return onlyOneChild
      }

      return false
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  .roles-table {
    margin-top: 30px;
  }

  .permission-tree {
    margin-bottom: 30px;
  }
}
</style>
