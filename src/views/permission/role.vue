<template>
  <div class="app-container">
    <el-button type="primary" @click="handleAddRole">
      Add Role
    </el-button>

    <el-table v-loading="listLoading" :data="rolesList" style="width: 100%;margin-top:30px;" border>
      <el-table-column align="center" label="Role Code" width="220">
        <template slot-scope="scope">
          {{ scope.row.code }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="Role Name" width="220">
        <template slot-scope="scope">
          {{ scope.row.name }}
        </template>
      </el-table-column>
      <el-table-column align="header-center" label="Description">
        <template slot-scope="scope">
          {{ scope.row.description }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="Operations">
        <template slot-scope="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope)">
            Edit Permission
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope)">
            Delete
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :visible.sync="dialogVisible" :title="dialogType === 'edit' ? 'Edit Role' : 'New Role'">
      <el-form :model="role" label-width="80px" label-position="left">
        <el-form-item label="Name">
          <el-input v-model="role.name" placeholder="Role Name" />
        </el-form-item>
        <el-form-item label="Code">
          <el-input v-model="role.code" placeholder="Role Code" />
        </el-form-item>
        <el-form-item label="Desc">
          <el-input v-model="role.description" :autosize="{ minRows: 2, maxRows: 4 }" type="textarea"
            placeholder="Role Description" />
        </el-form-item>
        <el-form-item label="Menus">
          <el-tree ref="tree" :check-strictly="checkStrictly" :data="routesData" :props="defaultProps" show-checkbox
            node-key="path" class="permission-tree" />
        </el-form-item>
      </el-form>
      <div style="text-align:right;">
        <el-button type="danger" @click="dialogVisible = false">
          Cancel
        </el-button>
        <el-button type="primary" @click="confirmRole">
          Confirm
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import path from 'path'
import { deepClone } from '@/utils'
import { getRoutes, getRoles, addRole, deleteRole, updateRole } from '@/api/permission'

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
      this.$confirm('Confirm to remove the role?', 'Warning', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      })
        .then(async () => {
          await deleteRole(row.id)
          this.rolesList.splice($index, 1)
          this.$message({
            type: 'success',
            message: 'Delete succed!'
          })
        })
        .catch(err => { console.error(err) })
    },
    generateTree(routes, basePath = '/', checkedKeys) {
      const res = []

      for (const route of routes) {
        const routePath = path.resolve(basePath, route.path)

        // recursive child routes
        if (route.children) {
          route.children = this.generateTree(route.children, routePath, checkedKeys)
        }

        if (checkedKeys.includes(routePath) || (route.children && route.children.length >= 1)) {
          res.push(route)
        }
      }
      return res
    },
    async confirmRole() {
      const isEdit = this.dialogType === 'edit'

      const checkedKeys = this.$refs.tree.getCheckedKeys()
      this.role.routes = this.generateTree(deepClone(this.serviceRoutes), '/', checkedKeys)

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
        title: 'Success',
        dangerouslyUseHTMLString: true,
        message: `
            <div>Role Code: ${code}</div>
            <div>Role Name: ${name}</div>
            <div>Description: ${description}</div>
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
