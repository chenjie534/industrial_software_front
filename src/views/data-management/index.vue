<template>
  <div class="data-management-container">
    <!-- 选择框 -->
    <div class="select-container">
      <span>要素数据库</span>
      <el-select v-model="selectedDatabase" placeholder="请选择数据库" @change="loadTableData">
        <el-option label="仿真结果数据库" value="simulationResult" />
        <el-option label="算例库" value="exampleLibrary" />
        <el-option label="材料本构数据库" value="materialConstitutive" />
        <el-option label="连接性能数据库" value="connectionPerformance" />
        <el-option label="模型库" value="modelLibrary" />
        <el-option label="航空假人库" value="aircraftDummy" />
      </el-select>
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" style="width: 100%" v-if="selectedDatabase">
      <el-table-column prop="taskName" label="任务名" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small" @click="downloadFile(row.taskId)">下载文件</el-button>
          <el-upload
            :action="uploadUrl"
            :data="{ taskId: row.taskId }"
            :show-file-list="false"
            :before-upload="beforeUpload"
            @success="handleUploadSuccess"
            @error="handleUploadError"
          >
            <el-button size="small">上传文件</el-button>
          </el-upload>
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
      @current-change="handlePageChange"
      class="pagination"
      v-if="selectedDatabase"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { ElSelect, ElOption, ElTable, ElTableColumn, ElButton, ElPagination, ElUpload, ElMessage } from "element-plus"

// 模拟数据
const mockData = {
  simulationResult: [
    {
      taskId: "SR001",
      taskName: "飞机碰撞仿真结果"
    },
    {
      taskId: "SR002",
      taskName: "机翼气流仿真结果"
    },
    {
      taskId: "SR003",
      taskName: "发动机燃烧仿真结果"
    }
  ],
  exampleLibrary: [
    {
      taskId: "EL001",
      taskName: "飞机起降算例"
    },
    {
      taskId: "EL002",
      taskName: "飞行姿态调整算例"
    },
    {
      taskId: "EL003",
      taskName: "紧急迫降算例"
    }
  ],
  materialConstitutive: [
    {
      taskId: "MC001",
      taskName: "航空铝合金本构数据"
    },
    {
      taskId: "MC002",
      taskName: "碳纤维复合材料本构数据"
    },
    {
      taskId: "MC003",
      taskName: "钛合金本构数据"
    }
  ],
  connectionPerformance: [
    {
      taskId: "CP001",
      taskName: "螺栓连接性能数据"
    },
    {
      taskId: "CP002",
      taskName: "焊接连接性能数据"
    },
    {
      taskId: "CP003",
      taskName: "铆接连接性能数据"
    }
  ],
  modelLibrary: [
    {
      taskId: "ML001",
      taskName: "波音747模型"
    },
    {
      taskId: "ML002",
      taskName: "空客A380模型"
    },
    {
      taskId: "ML003",
      taskName: "歼-20模型"
    }
  ],
  aircraftDummy: [
    {
      taskId: "AD001",
      taskName: "成人航空假人数据"
    },
    {
      taskId: "AD002",
      taskName: "儿童航空假人数据"
    },
    {
      taskId: "AD003",
      taskName: "特殊体型航空假人数据"
    }
  ]
}

// 选择框绑定的值
const selectedDatabase = ref("")

// 表格数据
const tableData = ref([])

// 分页配置
const totalTasks = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 上传文件的 URL
const uploadUrl = "/api/upload"

// 加载表格数据
const loadTableData = () => {
  if (selectedDatabase.value) {
    const data = mockData[selectedDatabase.value]
    tableData.value = data
    totalTasks.value = data.length
  }
}

// 分页切换处理
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadTableData()
}

// 下载文件方法
const downloadFile = (taskId: string) => {
  // 模拟下载
  console.log(`下载文件，任务 ID: ${taskId}`)
  ElMessage.success("模拟下载成功")
}

// 上传文件前的钩子
const beforeUpload = (file: File) => {
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error("上传文件大小不能超过 2MB")
  }
  return isLt2M
}

// 上传文件成功处理
const handleUploadSuccess = (response: any) => {
  if (response.code === 0) {
    ElMessage.success("上传文件成功")
    loadTableData()
  } else {
    ElMessage.error("上传文件失败")
  }
}

// 上传文件失败处理
const handleUploadError = () => {
  ElMessage.error("上传文件失败")
}
</script>

<style scoped lang="scss">
.data-management-container {
  padding: 20px;
}

.select-container {
  display: flex;
  align-items: center;
  margin-bottom: 20px;

  span {
    margin-right: 10px;
  }
}

.pagination {
  margin-top: 20px;
}
</style>
