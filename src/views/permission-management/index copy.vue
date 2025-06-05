<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import { ElTable, ElTableColumn, ElButton, ElInput, ElTag, ElPagination, ElMessage, ElMessageBox } from "element-plus"
import { getUserPageApi, changePermissionApi } from "@/api/permission"
import type { ApiResponse, PermissionUser } from "@/api/permission/types/userInfo"

// 用户数据
const userData = ref<PermissionUser[]>([])
const totalUsers = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref("")
const isLoading = ref(false)
const paginationKey = ref(0) // 用于强制分页组件重新渲染

// 获取分页数据
const fetchUserData = async () => {
  if (isLoading.value) return

  isLoading.value = true
  try {
    const response = await getUserPageApi({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchQuery.value.trim()
    })

    if (response.code === 200) {
      userData.value = response.data.records
      totalUsers.value = response.data.total
      paginationKey.value++ // 数据更新后强制分页组件重新渲染
    } else {
      ElMessage.error(response.message || "获取用户信息失败")
    }
  } catch (error) {
    console.error("获取用户信息失败:", error)
    ElMessage.error("获取用户信息失败")
  } finally {
    isLoading.value = false
  }
}

// 修改权限
const toggleUserStatus = async (row: PermissionUser) => {
  try {
    await ElMessageBox.confirm(`确定要${row.permission === 1 ? "撤销" : "授予"}管理员权限吗？`, "权限修改确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    const newPermission = row.permission === 1 ? 0 : 1
    const response = await changePermissionApi(row.userId, newPermission)

    if (response.code === 200) {
      row.permission = newPermission
      ElMessage.success("权限修改成功")
    } else {
      ElMessage.error(response.message || "权限修改失败")
    }
  } catch (error) {
    if ((error as Error).message !== "cancel") {
      console.error("权限修改失败:", error)
      ElMessage.error("权限修改失败")
    }
  }
}

// 分页处理
const handleCurrentChange = (newPage: number) => {
  if (currentPage.value === newPage) return // 防止重复请求

  currentPage.value = newPage
  fetchUserData()
}

// 搜索功能
const handleSearch = () => {
  if (currentPage.value === 1) {
    fetchUserData() // 如果已经在第一页，直接刷新
  } else {
    currentPage.value = 1 // 否则重置到第一页
  }
}

// 修改任务权限
const editTaskInfo = (row: any) => {
  console.log("修改任务权限:个人创建的任务有该任务的各种数据权限，可以开放给别人", row)
  // 要修改用户的任务权限（个人创建的任务肯定是自己有该任务的数据权限）
}

onMounted(() => {
  fetchUserData()
})
</script>

<template>
  <div class="user-page">
    <div class="header">
      <div class="search-container">
        <el-input v-model="searchQuery" placeholder="请输入用户名" class="search-input" @keyup.enter="handleSearch" />
        <el-button type="primary" @click="handleSearch" :loading="isLoading">搜索</el-button>
      </div>
    </div>

    <el-table :data="userData" style="width: 100%" v-loading="isLoading">
      <el-table-column prop="username" label="用户名" width="180" />
      <el-table-column prop="phone" label="手机号" width="200" />
      <el-table-column prop="permission" label="用户权限" width="150">
        <template #default="{ row }">
          <el-tag :type="row.permission === 1 ? 'success' : 'danger'">
            {{ row.permission === 1 ? "管理员" : "普通用户" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="toggleUserStatus(row)">
            {{ row.permission === 1 ? "撤销管理员" : "设为管理员" }}
          </el-button>
          <el-button size="small" @click="editTaskInfo(row)">修改任务权限</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      :key="paginationKey"
      background
      layout="total, prev, pager, next, jumper"
      :total="totalUsers"
      :current-page="currentPage"
      :page-size="pageSize"
      @current-change="handleCurrentChange"
      class="pagination"
      :disabled="isLoading"
    />
  </div>
</template>

<style scoped lang="scss">
.user-page {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
}

.header {
  margin-bottom: 20px;
}

.search-container {
  display: flex;
  gap: 10px;
  width: 400px;
}

.el-table {
  margin: 20px 0;
  flex-grow: 1;
}

.pagination {
  margin-top: 20px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
