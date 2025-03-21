<template>
  <div class="app-container">
    <div class="menu-container">
      <!-- 左侧树形菜单 -->
      <div class="menu-tree">
        <el-tree
          :data="menuTree"
          :props="defaultProps"
          node-key="id"
          default-expand-all
          highlight-current
          @node-click="handleNodeClick"
        >
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <span>{{ node.label }}</span>
          </span>
        </el-tree>
      </div>

      <!-- 右侧菜单列表 -->
      <div class="menu-list">
        <el-button type="primary" @click="handleAddMenu"> 新增菜单 </el-button>

        <el-table
          ref="dragTable"
          v-loading="listLoading"
          :data="menuList"
          row-key="id"
          border
          style="width: 100%; margin-top: 20px"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        >
          <el-table-column label="菜单名称" min-width="150">
            <template slot-scope="{ row }">
              <el-input v-if="row.isEdit" v-model="row.title" size="mini" />
              <span v-else>{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column label="路径" min-width="200">
            <template slot-scope="{ row }">
              <el-input v-if="row.isEdit" v-model="row.path" size="mini" />
              <span v-else>{{ row.path }}</span>
            </template>
          </el-table-column>
          <el-table-column label="排序" width="200">
            <template slot-scope="{ row }">
              <el-input-number
                v-if="row.isEdit"
                v-model="row.sort"
                :min="0"
                size="mini"
              />
              <span v-else>{{ row.sort }}</span>
            </template>
          </el-table-column>
          <el-table-column label="拖拽" width="60" align="center">
            <template slot-scope="{ row }">
              <i
                class="el-icon-rank"
                style="cursor: move"
                draggable="true"
                @dragstart="handleDragStart($event, row)"
                @dragover.prevent
                @drop="handleDrop($event, row)"
              ></i>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" align="center">
            <template slot-scope="{ row }">
              <template v-if="row.isEdit">
                <el-button type="success" size="mini" @click="handleSave(row)">
                  保存
                </el-button>
                <el-button size="mini" @click="handleCancel(row)">
                  取消
                </el-button>
              </template>
              <template v-else>
                <el-button type="primary" size="mini" @click="handleEdit(row)">
                  编辑
                </el-button>
                <el-button type="danger" size="mini" @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 新增菜单对话框 -->
    <el-dialog :visible.sync="dialogVisible" title="新增菜单">
      <el-form :model="menuForm" label-width="80px" label-position="left">
        <el-form-item label="菜单名称">
          <el-input v-model="menuForm.title" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="路径">
          <el-input v-model="menuForm.path" placeholder="请输入路径" />
        </el-form-item>
        <el-form-item label="父级菜单">
          <el-select v-model="menuForm.parentId" placeholder="请选择父级菜单">
            <el-option label="无" :value="null" />
            <el-option
              v-for="item in menuList"
              :key="item.id"
              :label="item.title"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="menuForm.sort" :min="0" />
        </el-form-item>
      </el-form>
      <div style="text-align: right">
        <el-button type="danger" @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="confirmMenu"> 确定 </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getMenuList,
  addMenu,
  updateMenu,
  deleteMenu,
  updateMenuList
} from '@/api/menu'

export default {
  name: 'MenuList',
  data() {
    return {
      menuList: [],
      menuTree: [],
      listLoading: true,
      dialogVisible: false,
      defaultProps: {
        children: 'children',
        label: 'title'
      },
      menuForm: {
        title: '',
        path: '',
        parentId: null,
        sort: 0
      }
    }
  },
  created() {
    this.getList()
  },
  mounted() {},
  methods: {
    async getList() {
      this.listLoading = true
      try {
        const response = await getMenuList()
        if (response.code === 200) {
          this.menuList = this.formatMenuData(response.data)
          this.menuTree = response.data
        }
      } catch (error) {
        console.error('Failed to fetch menu list:', error)
      } finally {
        this.listLoading = false
      }
    },
    formatMenuData(data) {
      return data.map(item => ({
        ...item,
        isEdit: false
      }))
    },
    handleNodeClick(data) {
      console.log(data)
    },
    handleAddMenu() {
      this.dialogVisible = true
      this.menuForm = {
        name: '',
        code: '',
        path: '',
        parentId: null,
        sort: 0
      }
    },
    handleEdit(row) {
      row.isEdit = true
      row._originalData = { ...row }
    },
    handleCancel(row) {
      Object.assign(row, row._originalData)
      row.isEdit = false
      delete row._originalData
    },
    async handleSave(row) {
      try {
        const response = await updateMenu(row)
        if (response.code === 200) {
          this.$message.success('更新成功')
          row.isEdit = false
          delete row._originalData
          this.getList()
        }
      } catch (error) {
        console.error('Failed to update menu:', error)
        this.$message.error('更新失败')
      }
    },
    handleDelete(row) {
      this.$confirm('确认删除该菜单吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await deleteMenu(row.id)
          if (response.code === 200) {
            this.$message.success('删除成功')
            this.getList()
          }
        } catch (error) {
          console.error('Failed to delete menu:', error)
          this.$message.error('删除失败')
        }
      })
    },

    handleDragStart(event, row) {
      event.dataTransfer.setData('text/plain', JSON.stringify(row))
    },

    findSameLevelMenuList(menuList, targetId) {
      for (const menu of menuList) {
        if (menu.children) {
          if (menu.children.some(child => child.id === targetId)) {
            return menu.children
          }
          const result = this.findSameLevelMenuList(menu.children, targetId)
          if (result) return result
        }
      }
      return null
    },

    async handleDrop(event, targetRow) {
      const sourceRow = JSON.parse(event.dataTransfer.getData('text/plain'))
      if (sourceRow.id === targetRow.id) return

      // 获取同级菜单
      let sameLevel = this.menuList.filter(
        item => item.parentId === sourceRow.parentId
      )

      // 如果是二级菜单，从树形结构中查找同级菜单
      if (sourceRow.parentId) {
        const sameLevelMenuList = this.findSameLevelMenuList(
          this.menuTree,
          sourceRow.id
        )
        if (sameLevelMenuList) {
          sameLevel = sameLevelMenuList
        }
      }

      // 获取原始位置和目标位置
      const sourceSort = sourceRow.sort
      const targetSort = targetRow.sort

      // 更新受影响的菜单项
      const updatedMenus = sameLevel.map(item => {
        const menu = { ...item }
        if (item.id === sourceRow.id) {
          menu.sort = targetSort
        } else if (
          sourceSort > targetSort &&
          item.sort >= targetSort &&
          item.sort < sourceSort
        ) {
          menu.sort = item.sort + 1
        } else if (
          sourceSort < targetSort &&
          item.sort > sourceSort &&
          item.sort <= targetSort
        ) {
          menu.sort = item.sort - 1
        }
        return menu
      })

      try {
        const response = await updateMenuList(updatedMenus)
        if (response.code === 200) {
          this.$message.success('更新成功')
          this.getList()
        }
      } catch (error) {
        console.error('Failed to update menu sort:', error)
        this.$message.error('更新失败')
      }
    },

    async confirmMenu() {
      try {
        const response = await addMenu(this.menuForm)
        if (response.code === 200) {
          this.$message.success('添加成功')
          this.dialogVisible = false
          this.getList()
        }
      } catch (error) {
        console.error('Failed to add menu:', error)
        this.$message.error('添加失败')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.menu-container {
  display: flex;
  gap: 20px;

  .menu-tree {
    width: 250px;
    border-right: 1px solid #dcdfe6;
    padding-right: 20px;
  }

  .menu-list {
    flex: 1;
  }
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}
</style>
