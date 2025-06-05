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
  ElTextArea,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElMessageBox
} from "element-plus"
import type { FormInstance, FormRules } from "element-plus"

// 任务数据
const taskData = ref([
  { name: "任务1", status: "处理中", taskType: "多体", action: "查看结果", description: "描述1", details: "详情1" },
  { name: "任务2", status: "处理中", taskType: "冲击", action: "查看结果", description: "描述2", details: "详情2" },
  { name: "任务3", status: "异常", taskType: "结构", action: "查看结果", description: "描述3", details: "详情3" }
])

// 显示任务详情的对话框控制
const taskDetailsDialogVisible = ref(false)
const taskEditDialogVisible = ref(false) // 用于控制修改任务详情对话框

// 当前查看的任务详情
const currentTaskDetails = reactive({
  name: "",
  status: "",
  taskType: "",
  description: "",
  details: ""
})

// 分页配置
const totalTasks = ref(30)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索框的绑定值
const searchQuery = ref("")

// 搜索功能
const handleSearch = () => {
  console.log("搜索任务:", searchQuery.value)
}

// 新建任务对话框的显示控制
const dialogVisible = ref(false)
const taskFormRef = ref<FormInstance>()

// 任务表单数据
const taskForm = reactive({
  name: "",
  status: "处理中",
  taskType: "多体",
  description: "",
  details: ""
})

// 表单验证规则
const validateName = (rule: any, value: any, callback: any) => {
  if (!value) {
    return callback(new Error("任务名称不能为空"))
  }
  callback()
}

const rules = reactive<FormRules<typeof taskForm>>({
  name: [{ validator: validateName, trigger: "blur" }]
})

// 提交新建任务表单
const handleCreateTask = () => {
  if (!taskFormRef.value) return
  taskFormRef.value.validate((valid) => {
    if (valid) {
      console.log("新建任务数据:", taskForm)
      taskData.value.push({
        name: taskForm.name,
        status: taskForm.status,
        taskType: taskForm.taskType,
        action: "查看结果",
        description: taskForm.description,
        details: taskForm.details
      })
      dialogVisible.value = false
    } else {
      console.log("表单验证失败")
    }
  })
}

// 提交修改任务表单
const handleEditTask = () => {
  if (!taskFormRef.value) return
  taskFormRef.value.validate((valid) => {
    if (valid) {
      // 更新任务数据
      const taskIndex = taskData.value.findIndex((task) => task.name === currentTaskDetails.name)
      if (taskIndex !== -1) {
        taskData.value[taskIndex] = { ...taskData.value[taskIndex], ...taskForm }
        taskEditDialogVisible.value = false
      }
    } else {
      console.log("表单验证失败")
    }
  })
}

// 查看任务详情
const viewTaskDetails = (row: any) => {
  currentTaskDetails.name = row.name
  currentTaskDetails.status = row.status
  currentTaskDetails.taskType = row.taskType
  currentTaskDetails.description = row.description
  currentTaskDetails.details = row.details

  taskDetailsDialogVisible.value = true
}

// 修改任务详情
const editTaskDetails = (row: any) => {
  console.log("修改任务详情:", row)
  currentTaskDetails.name = row.name
  currentTaskDetails.status = row.status
  currentTaskDetails.taskType = row.taskType
  currentTaskDetails.description = row.description
  currentTaskDetails.details = row.details

  taskForm.name = row.name
  taskForm.status = row.status
  taskForm.taskType = row.taskType
  taskForm.description = row.description
  taskForm.details = row.details

  taskEditDialogVisible.value = true
}

// 删除任务
const deleteTask = (row: any) => {
  // 弹出确认框，确认是否删除
  ElMessageBox.confirm("此操作将永久删除该任务, 是否继续?", "警告", {
    confirmButtonText: "删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      // 用户点击确认删除
      console.log("删除任务:", row)
      const index = taskData.value.indexOf(row)
      if (index !== -1) {
        taskData.value.splice(index, 1) // 从任务数据中删除该任务
      }
    })
    .catch(() => {
      // 用户取消删除操作
      console.log("删除操作已取消")
    })
}
</script>

<template>
  <div class="task-page">
    <!-- 搜索框和新增任务按钮 -->
    <div class="header">
      <div class="search-container">
        <el-input v-model="searchQuery" placeholder="请输入任务名称" class="search-input" />
        <el-button type="primary" @click="handleSearch" class="search-btn">搜索</el-button>
      </div>
      <el-button type="primary" @click="dialogVisible = true" class="add-task-btn">新建任务</el-button>
    </div>

    <!-- 任务列表表格 -->
    <el-table :data="taskData" style="width: 100%">
      <el-table-column prop="name" label="任务名称" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === '处理中' ? 'success' : 'danger'">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="taskType" label="任务类型" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small">{{ row.action }}</el-button>
          <!-- 下拉框 -->
          <el-dropdown trigger="click">
            <el-button size="small">
              更多
              <i class="el-icon-arrow-down el-icon--right" />
            </el-button>
            <template #dropdown>
              <el-dropdown-item @click="viewTaskDetails(row)">查看任务详情</el-dropdown-item>
              <el-dropdown-item @click="editTaskDetails(row)">修改任务详情</el-dropdown-item>
              <el-dropdown-item @click="deleteTask(row)">删除任务</el-dropdown-item>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      background
      layout="prev, pager, next"
      :total="totalTasks"
      :current-page="currentPage"
      :page-size="pageSize"
      @current-change="currentPage = $event"
      class="pagination"
    />

    <!-- 新建任务对话框 -->
    <el-dialog title="新建任务" v-model="dialogVisible" width="500px">
      <el-form ref="taskFormRef" :model="taskForm" status-icon :rules="rules" label-width="auto" class="demo-ruleForm">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="taskForm.name" autocomplete="off" />
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select v-model="taskForm.status" placeholder="请选择任务状态">
            <el-option label="处理中" value="处理中" />
            <el-option label="异常" value="异常" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务类型">
          <el-select v-model="taskForm.taskType" placeholder="请选择任务类型">
            <el-option label="多体" value="多体" />
            <el-option label="冲击" value="冲击" />
            <el-option label="结构" value="结构" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input type="textarea" v-model="taskForm.description" />
        </el-form-item>
        <el-form-item label="任务详情">
          <el-input type="textarea" v-model="taskForm.details" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateTask">确认</el-button>
      </template>
    </el-dialog>

    <!-- 查看任务详情对话框 -->
    <el-dialog title="查看任务详情" v-model="taskDetailsDialogVisible" width="500px">
      <el-form :model="currentTaskDetails" label-width="auto" class="demo-ruleForm">
        <el-form-item label="任务名称">
          <el-input v-model="currentTaskDetails.name" disabled />
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select v-model="currentTaskDetails.status" disabled>
            <el-option label="处理中" value="处理中" />
            <el-option label="异常" value="异常" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务类型">
          <el-select v-model="currentTaskDetails.taskType" disabled>
            <el-option label="多体" value="多体" />
            <el-option label="冲击" value="冲击" />
            <el-option label="结构" value="结构" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input v-model="currentTaskDetails.description" disabled />
        </el-form-item>
        <el-form-item label="任务详情">
          <el-input v-model="currentTaskDetails.details" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDetailsDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 修改任务详情对话框 -->
    <el-dialog title="修改任务详情" v-model="taskEditDialogVisible" width="500px">
      <el-form ref="taskFormRef" :model="taskForm" status-icon :rules="rules" label-width="auto" class="demo-ruleForm">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="taskForm.name" autocomplete="off" />
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select v-model="taskForm.status" placeholder="请选择任务状态">
            <el-option label="处理中" value="处理中" />
            <el-option label="异常" value="异常" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务类型">
          <el-select v-model="taskForm.taskType" placeholder="请选择任务类型">
            <el-option label="多体" value="多体" />
            <el-option label="冲击" value="冲击" />
            <el-option label="结构" value="结构" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input type="textarea" v-model="taskForm.description" />
        </el-form-item>
        <el-form-item label="任务详情">
          <el-input type="textarea" v-model="taskForm.details" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskEditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditTask">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.task-page {
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

.add-task-btn {
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
