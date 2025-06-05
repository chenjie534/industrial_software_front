<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import {
  ElTable,
  ElTableColumn,
  ElButton,
  ElInput,
  ElDialog,
  ElForm,
  ElFormItem,
  ElMessageBox,
  ElMessage
} from "element-plus"
import type { FormInstance, FormRules } from "element-plus"
import { updateUserInfoApi, deleteUserApi, resetPasswordApi, getAllUsersApi } from "@/api/userManagement"

// 定义后端返回数据结构
interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 定义用户类型
interface User {
  userId: string
  username: string
  phone: string
}

// 用户数据
const userData = ref<User[]>([])
const totalUsers = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref("")
const dialogVisible = ref(false)
const userFormRef = ref<FormInstance>()

// 用户表单数据
const userForm = reactive({
  userId: "",
  username: "",
  phone: ""
})

// 表单验证规则 - 移除未使用的参数
const validateName = (_: any, value: string, callback: any) => {
  if (!value) {
    return callback(new Error("用户名不能为空"))
  }
  callback()
}

const validatePhone = (_: any, value: string, callback: any) => {
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!value) {
    return callback(new Error("手机号不能为空"))
  } else if (!phoneRegex.test(value)) {
    return callback(new Error("请输入正确的手机号格式"))
  }
  callback()
}

const rules = reactive<FormRules<typeof userForm>>({
  username: [{ validator: validateName, trigger: "blur" }],
  phone: [{ validator: validatePhone, trigger: "blur" }]
})

// 获取所有用户数据
const fetchUsers = async () => {
  try {
    // 明确指定响应类型
    const response = (await getAllUsersApi()) as ApiResponse<User[]>
    if (response.code === 200) {
      userData.value = response.data
      totalUsers.value = response.data.length
    } else {
      ElMessage.error(response.message || "获取用户列表失败")
    }
  } catch (error) {
    console.error("获取用户列表错误:", error)
    ElMessage.error("获取用户列表失败，请重试")
  }
}

// 修改用户信息
const editUserInfo = (row: User) => {
  userForm.userId = row.userId
  userForm.username = row.username
  userForm.phone = row.phone
  dialogVisible.value = true
}

// 提交修改用户表单
const handleUpdateUser = async () => {
  if (!userFormRef.value) return
  userFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 调用API修改用户信息
        const response = (await updateUserInfoApi(
          Number(userForm.userId), // 转换为number类型
          {
            username: userForm.username,
            phone: userForm.phone
          }
        )) as ApiResponse

        if (response.code === 200) {
          // 更新本地数据
          const index = userData.value.findIndex((u) => u.userId === userForm.userId)
          if (index !== -1) {
            userData.value[index].username = userForm.username
            userData.value[index].phone = userForm.phone
          }

          ElMessage.success("修改成功")
          dialogVisible.value = false
        } else {
          ElMessage.error(response.message || "修改失败")
        }
      } catch (error) {
        console.error("修改用户失败:", error)
        ElMessage.error("修改失败，请重试")
      }
    } else {
      console.log("表单验证失败")
    }
  })
}

// 删除用户
const deleteUser = (row: User) => {
  ElMessageBox.confirm("此操作将永久删除该用户, 是否继续?", "警告", {
    confirmButtonText: "删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        // 调用API删除用户 - 修正userId类型
        await deleteUserApi(Number(row.userId))

        // 更新本地数据
        const index = userData.value.indexOf(row)
        if (index !== -1) {
          userData.value.splice(index, 1)
        }

        ElMessage.success("删除成功")
      } catch (error) {
        console.error("删除用户失败:", error)
        ElMessage.error("删除失败，请重试")
      }
    })
    .catch(() => {
      console.log("删除操作已取消")
    })
}

// 重置用户密码
const resetPassword = async (row: User) => {
  try {
    await ElMessageBox.confirm("确定要重置该用户密码吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    // 调用API重置密码
    const response = (await resetPasswordApi(Number(row.userId))) as ApiResponse

    if (response.code === 200) {
      ElMessage.success("重置密码成功，默认密码为：123456")
    } else {
      ElMessage.error(response.message || "重置密码失败")
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("重置密码失败:", error)
      ElMessage.error("重置密码失败，请重试")
    }
  }
}

// 搜索功能
const handleSearch = () => {
  console.log("搜索用户:", searchQuery.value)
  // TODO: 实现搜索逻辑
}

// 页面加载时获取用户数据
onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="user-page">
    <!-- 搜索框 -->
    <div class="header">
      <div class="search-container">
        <el-input v-model="searchQuery" placeholder="请输入用户名或手机号" class="search-input" />
        <el-button type="primary" @click="handleSearch" class="search-btn">搜索</el-button>
      </div>
    </div>

    <!-- 用户列表表格 -->
    <el-table :data="userData" style="width: 100%">
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small" @click="editUserInfo(row)">修改用户信息</el-button>
          <el-button size="small" @click="deleteUser(row)">删除用户</el-button>
          <el-button size="small" @click="resetPassword(row)">重置用户密码</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      background
      layout="prev, pager, next, total"
      :total="totalUsers"
      :current-page="currentPage"
      :page-size="pageSize"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      class="pagination"
    />

    <!-- 修改用户对话框 -->
    <el-dialog title="修改用户信息" v-model="dialogVisible" width="500px">
      <el-form ref="userFormRef" :model="userForm" status-icon :rules="rules" label-width="auto" class="demo-ruleForm">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" autocomplete="off" disabled />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" autocomplete="off" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateUser">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.user-page {
  padding: 20px;
  background-color: #f5f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  width: 300px;
}

.search-btn {
  margin-left: 10px;
}

.add-user-btn {
  align-self: center;
}

.el-table {
  margin-bottom: 20px;
}

.el-pagination {
  text-align: left;
  margin-top: 20px;
}

.pagination {
  position: absolute;
  bottom: 20px;
  left: 20px;
}

.el-dropdown-menu {
  min-width: 160px;
}

.el-dropdown-item {
  cursor: pointer;
}
</style>
