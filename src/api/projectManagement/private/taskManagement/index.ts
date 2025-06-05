import { request } from "@/utils/service"
import type { ApiResponse, PageData, task } from "@/api/projectManagement/shared/taskManagement/types/taskManagement"

/**
 * 项目管理-->私人项目管理-->任务管理 API
 */

// 获取私人任务分页列表
export function getTasksByProjectIdApi(
  projectId: number,
  data: { pageNum: number; pageSize: number; keyword?: string }
) {
  return request<ApiResponse<PageData<task>>>({
    url: `/modTasks/private/${projectId}/page`,
    method: "post",
    data
  })
}

// 新建任务
export function createTaskApi(
  projectId: number,
  data: { taskName: string; simulationStage: string; type: string; creator: string }
) {
  return request<ApiResponse<void>>({
    url: `/modTasks/private/${projectId}/create`,
    method: "post",
    data
  })
}

// 删除任务
export function deleteTaskApi(taskId: number) {
  return request<ApiResponse<void>>({
    url: `/modTasks/delete/${taskId}`,
    method: "delete"
  })
}
