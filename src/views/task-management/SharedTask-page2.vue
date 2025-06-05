<template>
  <div class="task-page">
    <!-- 导航 -->
    <div class="breadcrumb">
      <router-link to="/task-management/shared">/共享项目</router-link>
      <span>/任务</span>
    </div>
    <!-- 搜索框、搜索按钮和新建任务按钮 -->
    <div class="header">
      <div class="search-container">
        <el-input v-model="searchQuery" placeholder="请输入任务名称" class="search-input" @keyup.enter="handleSearch" />
        <el-button type="primary" @click="handleSearch" :loading="isLoading">搜索</el-button>
      </div>
      <el-button type="primary" @click="createTaskDialogVisible = true">新建任务</el-button>
    </div>
    <!-- 任务列表表格 -->
    <el-table :data="taskData" style="width: 100%" v-loading="isLoading">
      <el-table-column prop="task_name" label="任务名称" />
      <el-table-column prop="creator" label="创建者" />
      <el-table-column prop="simulationStage" label="仿真阶段" />
      <el-table-column prop="type" label="类型" />
      <el-table-column prop="creation_time" label="创建时间" />
      <el-table-column prop="status" label="当前状态">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small" @click="handleButtonA(row)">{{ getButtonAText(row.status) }}</el-button>
          <el-button v-if="getButtonBVisible(row.status)" size="small" type="danger" @click="handleButtonB(row)">
            {{ getButtonBText(row.status) }}
          </el-button>
          <el-button size="small" type="danger" @click="deleteTask(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <el-pagination
      :key="paginationKey"
      background
      layout="total, prev, pager, next, jumper"
      :total="totalTasks"
      :current-page="currentPage"
      :page-size="pageSize"
      @current-change="handlePageChange"
      class="pagination"
      :disabled="isLoading"
    />

    <!-- 新建任务对话框 -->
    <el-dialog title="新建任务" v-model="createTaskDialogVisible" width="500px">
      <el-form ref="taskFormRef" :model="taskForm" :rules="taskRules" label-width="auto">
        <el-form-item label="任务名称" prop="task_name">
          <el-input v-model="taskForm.task_name" />
        </el-form-item>
        <el-form-item label="仿真阶段" prop="simulationStage">
          <el-select
            v-model="taskForm.simulationStage"
            placeholder="请选择仿真阶段"
            @change="handleSimulationStageChange"
          >
            <el-option label="前处理" value="前处理" />
            <el-option label="后处理" value="后处理" />
            <el-option label="求解器" value="求解器" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="taskForm.type" placeholder="请选择类型">
            <template v-if="taskForm.simulationStage === '前处理' || taskForm.simulationStage === '求解器'">
              <el-option label="多体" value="多体" />
              <el-option label="结构" value="结构" />
              <el-option label="冲击" value="冲击" />
            </template>
            <template v-else-if="taskForm.simulationStage === '后处理'">
              <el-option label="通用后处理" value="通用后处理" />
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="创建者">
          <el-input v-model="taskForm.creator" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createTaskDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateTask">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRoute } from "vue-router"
import {
  ElTable,
  ElTableColumn,
  ElButton,
  ElInput,
  ElPagination,
  ElTag,
  ElDialog,
  ElForm,
  ElFormItem,
  ElSelect,
  ElOption,
  ElMessage,
  ElMessageBox
} from "element-plus"
import { getUserInfoApi } from "@/api/userInfo"
import { getTasksByProjectIdApi, createTaskApi, deleteTaskApi } from "@/api/projectManagement/shared/taskManagement"
import type { task } from "@/api/projectManagement/shared/taskManagement/types/taskManagement" // 引入获取任务信息的 API

const route = useRoute()
const projectId = ref(route.params.projectId as string)

// 任务数据
const taskData = ref<task[]>([])
const isLoading = ref(false)
const paginationKey = ref(0)

// 分页配置
const totalTasks = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索框的绑定值
const searchQuery = ref("")

// 新建任务对话框
const createTaskDialogVisible = ref(false)
const taskFormRef = ref()
const taskForm = ref({
  task_name: "",
  simulationStage: "",
  type: "",
  creator: ""
})
const taskRules = ref({
  task_name: [{ required: true, message: "任务名称不能为空", trigger: "blur" }],
  simulationStage: [{ required: true, message: "请选择仿真阶段", trigger: "change" }],
  type: [{ required: true, message: "请选择类型", trigger: "change" }]
})
// 获取分页任务数据
const fetchTasks = async (forceUpdate = false) => {
  if (isLoading.value && !forceUpdate) return

  isLoading.value = true
  try {
    const response = await getTasksByProjectIdApi(Number(projectId.value), {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchQuery.value
    })
    if (response.code === 200) {
      taskData.value = response.data.records
      totalTasks.value = response.data.total
      paginationKey.value++
    } else {
      ElMessage.error(response.message || "获取任务列表失败")
    }
  } catch (error) {
    console.error("获取任务列表失败:", error)
    ElMessage.error("获取任务列表失败")
  } finally {
    isLoading.value = false
  }
}

// 搜索功能
const handleSearch = () => {
  if (currentPage.value === 1) {
    fetchTasks(true)
  } else {
    currentPage.value = 1
  }
}

// 新建任务
const handleCreateTask = async () => {
  // 先手动触发验证
  await taskFormRef.value?.validate(async (valid) => {
    if (!valid) {
      ElMessage.error("请填写完整信息")
      return
    }

    try {
      const response = await createTaskApi(Number(projectId.value), {
        taskName: taskForm.value.task_name,
        simulationStage: taskForm.value.simulationStage,
        type: taskForm.value.type,
        creator: taskForm.value.creator
      })

      if (response.code === 200) {
        ElMessage.success("任务创建成功")
        await fetchTasks(true)
        createTaskDialogVisible.value = false
        // 重置表单
        taskFormRef.value?.resetFields()
      } else {
        ElMessage.error(response.message || "任务创建失败")
      }
    } catch (error) {
      console.error("新建任务失败:", error)
      ElMessage.error("新建任务失败")
    }
  })
}

// 删除任务
const deleteTask = async (row: task) => {
  console.log(row.taskId)
  try {
    await ElMessageBox.confirm("确定要删除该任务吗？", "警告", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning"
    })
    const response = await deleteTaskApi(row.taskId)
    if (response.code === 200) {
      ElMessage.success("任务删除成功")
      await fetchTasks(true)
    } else {
      ElMessage.error(response.message || "任务删除失败")
    }
  } catch (error) {
    if ((error as Error).message !== "cancel") {
      console.error("任务删除失败:", error)
      ElMessage.error("任务删除失败")
    }
  }
}
// 处理分页变化
const handlePageChange = (page: number) => {
  if (currentPage.value === page) return
  currentPage.value = page
  fetchTasks()
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  if (status === "未启动") {
    return "info"
  } else if (status === "仿真中") {
    return "success"
  } else if (status === "暂停中") {
    return "warning"
  }
  return ""
}

// 获取按钮 A 的文本
const getButtonAText = (status: string) => {
  if (status === "未启动") {
    return "启动"
  } else if (status === "仿真中") {
    return "暂停"
  } else if (status === "暂停中") {
    return "恢复"
  }
  return ""
}

// 获取按钮 B 的可见性
const getButtonBVisible = (status: string) => {
  return status !== "未启动"
}

// 获取按钮 B 的文本
const getButtonBText = (status: string) => {
  return "中止"
}

// 处理按钮 A 的点击事件
const handleButtonA = (row: task) => {
  if (row.status === "未启动") {
    // 调用启动任务接口
    console.log("启动任务:", row)
    row.status = "仿真中"
  } else if (row.status === "仿真中") {
    // 调用暂停任务接口
    console.log("暂停任务:", row)
    row.status = "暂停中"
  } else if (row.status === "暂停中") {
    // 调用恢复任务接口
    console.log("恢复任务:", row)
    row.status = "仿真中"
  }
}

// 处理按钮 B 的点击事件
const handleButtonB = (row: task) => {
  // 调用中止任务接口
  console.log("中止任务:", row)
}

// 处理仿真阶段选择变化
const handleSimulationStageChange = () => {
  if (taskForm.value.simulationStage === "后处理") {
    taskForm.value.type = "通用后处理"
  } else {
    taskForm.value.type = ""
  }
}

// 初始化
onMounted(async () => {
  try {
    const userResponse = await getUserInfoApi()
    taskForm.value.creator = userResponse.data.username
    await fetchTasks()
  } catch (error) {
    console.error("获取用户信息失败:", error)
    ElMessage.error("获取用户信息失败")
  }
})
</script>

<style scoped lang="scss">
.task-page {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-container {
  display: flex;
  gap: 10px;
  width: 400px;
}

.pagination {
  margin-top: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.el-table {
  margin: 20px 0;
  flex-grow: 1;
}
</style>
