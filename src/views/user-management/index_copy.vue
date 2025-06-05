<script setup lang="ts">
import { ref, reactive } from "vue"
import {
  ElTable,
  ElTableColumn,
  ElButton,
  ElInput,
  ElTag,
  ElDialog,
  ElForm,
  ElFormItem,
  ElSelect,
  ElOption,
  ElMessageBox,
  ElMessage
} from "element-plus"
import type { FormInstance, FormRules } from "element-plus"
import axios from "axios"
import { updateUserInfoApi, deleteUserApi, resetPasswordApi, getAllUsersApi } from "@/api/userManagement"

// 用户数据
const userData = ref([
  { userId: "1", username: "user1", phone: "1234567890", status: "正常", action: "查看详情" },
  { userId: "2", username: "user2", phone: "0987654321", status: "禁用", action: "查看详情" },
  { userId: "3", username: "user3", phone: "1357924680", status: "正常", action: "查看详情" }
])

// 分页配置
const totalUsers = ref(30)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索框的绑定值
const searchQuery = ref("")

// 搜索功能
const handleSearch = () => {
  console.log("搜索用户:", searchQuery.value)
}

// 新增用户对话框显示控制
const dialogVisible = ref(false)
const userFormRef = ref<FormInstance>()

// 用户表单数据
const userForm = reactive({
  userId: "",
  username: "",
  phone: ""
})

// 表单验证规则
const validateName = (rule: any, value: any, callback: any) => {
  if (!value) {
    return callback(new Error("用户名不能为空"))
  }
  callback()
}

const rules = reactive<FormRules<typeof userForm>>({
  username: [{ validator: validateName, trigger: "blur" }]
})

// // 提交新增用户表单
// const handleCreateUser = () => {
//   if (!userFormRef.value) return
//   userFormRef.value.validate((valid) => {
//     if (valid) {
//       console.log("新增用户数据:", userForm)
//       userData.value.push({
//         username: userForm.username,
//         phone: userForm.phone,
//         status: userForm.status,
//         action: "查看详情"
//       })
//       dialogVisible.value = false
//     } else {
//       console.log("表单验证失败")
//     }
//   })
// }
//
// // 启用或禁用用户
// const toggleUserStatus = (row: any) => {
//   // 切换用户状态
//   const index = userData.value.findIndex((user) => user.username === row.username)
//   if (index !== -1) {
//     userData.value[index].status = row.status === "禁用" ? "正常" : "禁用"
//     //把用户ID和状态传给后端，后端修改用户状态（禁用/正常），在登陆时要检查该用户是否被禁用，若被禁用同样登陆失败
//   }
//   console.log(row.status === "禁用" ? "启用用户:" : "禁用用户:", row)
// }

// 修改用户信息
const editUserInfo = (row: any) => {
  console.log("修改用户信息:", row)
  userForm.userId = row.userId
  userForm.username = row.username
  userForm.phone = row.phone
  // userForm.status = row.status
  dialogVisible.value = true
}
// 提交修改用户表单
const handleUpdateUser = async () => {
  if (!userFormRef.value) return
  userFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 向后端发送修改请求
        const response = await axios.post(`/api/users/${userForm.userId}/update`, {
          username: userForm.username,
          phone: userForm.phone
        })

        // if (response.data.code === 200) {
        if (response.data.code === 200) {
          // 更新本地数据
          const index = userData.value.findIndex((u) => u.username === userForm.username)
          if (index !== -1) {
            userData.value[index].phone = userForm.phone
          }

          // 显示成功提示
          ElMessage.success("修改成功")
          dialogVisible.value = false
        } else {
          ElMessage.error(response.data.message || "修改失败")
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
// 重置用户密码
const resetPassword = async (row: any) => {
  try {
    // 弹出确认框
    await ElMessageBox.confirm("确定要重置该用户密码吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    // 向后端发送重置密码请求
    const response = await axios.post(`/api/users/${row.userId}/resetPassword`)

    if (response.data.code === 200) {
      ElMessage.success("重置密码成功，默认密码为：123456")
    } else {
      ElMessage.error(response.data.message || "重置密码失败")
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("重置密码失败:", error)
      ElMessage.error("重置密码失败，请重试")
    }
  }
}
// 删除用户
const deleteUser = (row: any) => {
  // 弹出确认框，确认是否删除
  ElMessageBox.confirm("此操作将永久删除该用户, 是否继续?", "警告", {
    confirmButtonText: "删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      // 用户点击确认删除
      console.log("删除用户:", row)
      const index = userData.value.indexOf(row)
      if (index !== -1) {
        userData.value.splice(index, 1) // 从用户数据中删除该用户
      }
    })
    .catch(() => {
      // 用户取消删除操作
      console.log("删除操作已取消")
    })
}
</script>

<template>
  <div class="user-page">
    <!-- 搜索框和新增用户按钮 -->
    <div class="header">
      <div class="search-container">
        <el-input v-model="searchQuery" placeholder="请输入用户名或手机号" class="search-input" />
        <el-button type="primary" @click="handleSearch" class="search-btn">搜索</el-button>
      </div>
      <!--      <el-button type="primary" @click="dialogVisible = true" class="add-user-btn">新增用户</el-button>-->
    </div>

    <!-- 用户列表表格 -->
    <el-table :data="userData" style="width: 100%">
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="phone" label="手机号" />
      <!--      <el-table-column prop="status" label="用户状态">-->
      <!--        <template #default="{ row }">-->
      <!--          <el-tag :type="row.status === '正常' ? 'success' : 'danger'">-->
      <!--            {{ row.status }}-->
      <!--          </el-tag>-->
      <!--        </template>-->
      <!--      </el-table-column>-->
      <el-table-column label="操作">
        <template #default="{ row }">
          <!--          <el-button size="small" @click="toggleUserStatus(row)">-->
          <!--            {{ row.status === "禁用" ? "启用用户" : "禁用用户" }}-->
          <!--          </el-button>-->
          <el-button size="small" @click="editUserInfo(row)">修改用户信息</el-button>
          <el-button size="small" @click="deleteUser(row)">删除用户</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      background
      layout="prev, pager, next"
      :total="totalUsers"
      :current-page="currentPage"
      :page-size="pageSize"
      @current-change="currentPage = $event"
      class="pagination"
    />

    <!-- 新增用户对话框 -->
    <el-dialog title="修改用户信息" v-model="dialogVisible" width="500px">
      <el-form ref="userFormRef" :model="userForm" status-icon :rules="rules" label-width="auto" class="demo-ruleForm">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" autocomplete="off" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" autocomplete="off" />
        </el-form-item>
        <el-form-item label="重置密码">
          <el-button size="small" type="warning" @click="resetPassword(userForm)">重置用户密码</el-button>
          <!--          <el-select v-model="userForm.status" placeholder="请选择用户状态">-->
          <!--            <el-option label="正常" value="正常" />-->
          <!--            <el-option label="禁用" value="禁用" />-->
          <!--          </el-select>-->
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
