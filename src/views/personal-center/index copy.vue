<template>
  <div class="personal-center-container">
    <!-- 基本资料部分 -->
    <div class="basic-info">
      <h2>基本资料</h2>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本资料" name="basic">
          <div class="user-info">
            <div class="info-item">
              <el-icon><User /></el-icon>
              <span>用户名：</span>
              <span>{{ userInfo.username }}</span>
            </div>
            <div class="info-item">
              <el-icon><Phone /></el-icon>
              <span>手机号：</span>
              <span>{{ userInfo.phone }}</span>
            </div>
            <div class="info-item">
              <el-icon><User /></el-icon>
              <span>权限：</span>
              <span>{{ userInfo.permission === 1 ? "管理员" : "普通用户" }}</span>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="修改密码" name="password">
          <el-form :model="form" status-icon :rules="rules" ref="form" label-width="100px" class="demo-ruleForm">
            <el-form-item label="旧密码" prop="oldPassword">
              <el-input type="password" v-model="form.oldPassword" autocomplete="off" />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input type="password" v-model="form.newPassword" autocomplete="off" />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input type="password" v-model="form.confirmPassword" autocomplete="off" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitForm">保存</el-button>
              <el-button @click="resetForm">关闭</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import { ElForm, ElFormItem, ElInput, ElButton, ElTabs, ElTabPane, ElIcon } from "element-plus"
import { User, Phone } from "@element-plus/icons-vue"
import { getCurrentInstance } from "vue"
import { getUserInfoApi } from "@/api/userInfo" // 假设你有一个获取当前用户信息的 API

// 表单数据
const form = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
})

// 表单验证规则
const rules = reactive({
  oldPassword: [{ required: true, message: "请输入旧密码", trigger: "blur" }],
  newPassword: [{ required: true, message: "请输入新密码", trigger: "blur" }],
  confirmPassword: [
    { required: true, message: "请确认新密码", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value !== form.newPassword) {
          callback(new Error("两次输入密码不一致!"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ]
})

// 用于切换选项卡
const activeTab = ref("basic")

// 用户信息
const userInfo = ref({
  username: "",
  phone: "",
  permission: 0 // 0: 普通用户, 1: 管理员
})

// 提交表单方法
const submitForm = () => {
  const instance = getCurrentInstance()
  if (instance) {
    const formRef = instance.refs.form as typeof ElForm
    if (formRef) {
      formRef.validate((valid: boolean) => {
        if (valid) {
          console.log("提交成功")
          // 这里可以添加实际的提交逻辑，比如调用 API 保存密码等
        } else {
          console.log("验证失败，请检查输入")
          return false
        }
      })
    }
  }
}

// 重置表单方法
const resetForm = () => {
  const instance = getCurrentInstance()
  if (instance) {
    const formRef = instance.refs.form as typeof ElForm
    if (formRef) {
      formRef.resetFields()
    }
  }
}

// 在组件挂载时获取用户信息
onMounted(async () => {
  try {
    const response = await getUserInfoApi()
    userInfo.value = response.data // 假设 API 返回的是一个包含用户信息的对象
  } catch (error) {
    console.error("获取用户信息失败:", error)
  }
})
</script>

<style scoped lang="scss">
.personal-center-container {
  display: flex;
  gap: 20px;
}

.basic-info {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 20px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
