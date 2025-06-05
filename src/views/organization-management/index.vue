<script setup lang="ts">
import { ref, onMounted } from "vue"
import {
  ElTable,
  ElTableColumn,
  ElButton,
  ElInput,
  ElPagination,
  ElMessage,
  ElMessageBox,
  ElDialog
} from "element-plus"
import {
  getOrganizationListApi as getOrgPageApi,
  createOrganizationApi as addOrgApi,
  getOrganizationMembersApi as getOrgMembersApi,
  getUnassignedMembersApi,
  removeMemberFromOrganizationApi as removeMemberApi,
  addMembersToOrganizationApi as addMemberToOrgApi
} from "@/api/organizationManagement"

// 类型定义
interface Organization {
  orgId: string
  orgName: string
  creator: string
  createTime: string
}

interface Member {
  userId: string
  userName: string
}

// 组织列表相关
const orgData = ref<Organization[]>([])
const totalOrgs = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref("")
const isLoading = ref(false)

// 成员管理相关
const memberDialogVisible = ref(false)
const addMemberDialogVisible = ref(false)
const currentOrgId = ref("")
const members = ref<Member[]>([])
const unassignedMembers = ref<Member[]>([])
const memberTotal = ref(0)
const unassignedTotal = ref(0)
const memberPage = ref(1)
const unassignedPage = ref(1)
const loadingMembers = ref(false)
const loadingUnassigned = ref(false)

// 获取组织列表
const fetchOrgData = async () => {
  if (isLoading.value) return

  isLoading.value = true
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      orgName: searchQuery.value.trim()
    }
    const res = await getOrgPageApi(params)

    if (res.code === 200) {
      orgData.value = res.data.records
      totalOrgs.value = res.data.total
    }
  } catch (error) {
    ElMessage.error("获取组织列表失败")
  } finally {
    isLoading.value = false
  }
}

// 新增组织
const handleAddOrg = async () => {
  try {
    const { value: orgName } = await ElMessageBox.prompt("请输入组织名称", "新增组织", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /^.{2,20}$/,
      inputErrorMessage: "组织名称需2-20个字符"
    })

    const res = await addOrgApi({ orgName })
    if (res.code === 200) {
      ElMessage.success("组织创建成功")
      fetchOrgData()
    }
  } catch (error) {
    if ((error as Error).message !== "cancel") {
      ElMessage.error("组织创建失败")
    }
  }
}

// 成员管理弹窗
const viewMembers = async (row: Organization) => {
  currentOrgId.value = row.orgId
  memberDialogVisible.value = true
  await loadMembers()
}

const loadMembers = async () => {
  loadingMembers.value = true
  try {
    const res = await getOrgMembersApi(currentOrgId.value, {
      pageNum: memberPage.value,
      pageSize: pageSize.value
    })
    members.value = res.data.records
    memberTotal.value = res.data.total
  } finally {
    loadingMembers.value = false
  }
}

const handleDeleteMember = async (userId: string) => {
  try {
    await ElMessageBox.confirm("确定要移除该成员吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    const res = await removeMemberApi(currentOrgId.value, userId)

    if (res.code === 200) {
      ElMessage.success("成员移除成功")
      loadMembers()
    }
  } catch {}
}

// 添加成员弹窗
const addMember = async (row: Organization) => {
  currentOrgId.value = row.orgId
  addMemberDialogVisible.value = true
  await loadUnassignedMembers()
}

const loadUnassignedMembers = async () => {
  loadingUnassigned.value = true
  try {
    const res = await getUnassignedMembersApi({
      pageNum: unassignedPage.value,
      pageSize: pageSize.value
    })
    unassignedMembers.value = res.data.records
    unassignedTotal.value = res.data.total
  } finally {
    loadingUnassigned.value = false
  }
}

const handleAddMember = async (userId: string) => {
  try {
    const res = await addMemberToOrgApi(currentOrgId.value, {
      userIds: [userId]
    })

    if (res.code === 200) {
      ElMessage.success("添加成功")
      loadMembers()
      loadUnassignedMembers()
    }
  } catch {
    ElMessage.error("添加失败")
  }
}

// 分页处理
const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage
  fetchOrgData()
}

const handleMemberPageChange = (newPage: number) => {
  memberPage.value = newPage
  loadMembers()
}

const handleUnassignedPageChange = (newPage: number) => {
  unassignedPage.value = newPage
  loadUnassignedMembers()
}

// 搜索功能
const handleSearch = () => {
  currentPage.value = 1
  fetchOrgData()
}

onMounted(() => {
  fetchOrgData()
})
</script>

<!-- 剩余template和style部分保持不变 -->

<template>
  <div class="org-page">
    <div class="header">
      <div class="search-container">
        <el-input v-model="searchQuery" placeholder="请输入组织名称" class="search-input" @keyup.enter="handleSearch" />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button type="success" @click="handleAddOrg" style="margin-left: auto">新增组织</el-button>
      </div>
    </div>

    <el-table :data="orgData" style="width: 100%" v-loading="isLoading">
      <el-table-column prop="orgName" label="组织名称" width="220" />
      <el-table-column prop="creator" label="创建人" width="180" />
      <el-table-column prop="createTime" label="创建时间" width="220" />
      <el-table-column label="操作" width="260">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="viewMembers(row)">查看成员</el-button>
          <el-button type="success" size="small" @click="addMember(row)">新增成员</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      background
      layout="total, prev, pager, next"
      :total="totalOrgs"
      :current-page="currentPage"
      :page-size="pageSize"
      @current-change="handleCurrentChange"
      class="pagination"
    />

    <!-- 成员管理弹窗 -->
    <el-dialog v-model="memberDialogVisible" title="组织成员管理" width="60%">
      <el-table :data="members" v-loading="loadingMembers">
        <el-table-column prop="userName" label="成员姓名" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="danger" size="small" @click="handleDeleteMember(row.userId)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        background
        layout="prev, pager, next"
        :total="memberTotal"
        :current-page="memberPage"
        :page-size="pageSize"
        @current-change="handleMemberPageChange"
        class="dialog-pagination"
      />
    </el-dialog>

    <!-- 添加成员弹窗 -->
    <el-dialog v-model="addMemberDialogVisible" title="添加新成员" width="60%">
      <el-table :data="unassignedMembers" v-loading="loadingUnassigned">
        <el-table-column prop="userName" label="成员姓名" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleAddMember(row.userId)">添加</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        background
        layout="prev, pager, next"
        :total="unassignedTotal"
        :current-page="unassignedPage"
        :page-size="pageSize"
        @current-change="handleUnassignedPageChange"
        class="dialog-pagination"
      />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.org-page {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 60px);

  .header {
    margin-bottom: 20px;

    .search-container {
      display: flex;
      gap: 10px;
      width: 100%;
      align-items: center;
    }
  }

  .el-table {
    margin: 20px 0;
  }

  .pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }

  .dialog-pagination {
    margin-top: 20px;
    justify-content: center;
  }
}

.el-dialog {
  .el-table {
    margin-bottom: 20px;
  }
}
</style>
