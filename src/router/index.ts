import { type RouteRecordRaw, createRouter } from "vue-router"
import { history, flatMultiLevelRoutes } from "./helper"
import routeSettings from "@/config/route"

const Layouts = () => import("@/layouts/index.vue")

/**
 * 常驻路由
 * 除了 redirect/403/404/login 等隐藏页面，其他页面建议设置 Name 属性
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/redirect",
    component: Layouts,
    meta: {
      hidden: true
    }
    // ,
    // children: [
    //   {
    //     path: "/redirect/:path(.*)",
    //     component: () => import("@/views/redirect/index.vue")
    //   }
    // ]
  },
  {
    path: "/403",
    component: () => import("@/views/error-page/403.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/404",
    component: () => import("@/views/error-page/404.vue"),
    meta: {
      hidden: true
    },
    alias: "/:pathMatch(.*)*"
  },
  {
    path: "/login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/register",
    component: () => import("@/views/register/index.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/",
    component: Layouts,
    redirect: "/task-management/shared",
    meta: { title: "用户功能", svgIcon: "dashboard" },
    children: [
      /* {
        path: "dashboard",
        component: () => import("@/views/task-management/SharedTask-page1.vue"),
        name: "Dashboard",
        meta: {
          title: "主页",
          svgIcon: "dashboard",
          affix: true
        }
      }, */
      {
        path: "task-management",
        name: "TaskManagement",
        meta: { title: "项目管理", svgIcon: "task-management" },
        children: [
          {
            path: "shared",
            name: "SharedTaskPage1",
            component: () => import("@/views/task-management/SharedTask-page1.vue"),
            meta: { title: "共享项目" }
          },
          {
            path: "shared/:projectId",
            name: "SharedTaskPage2",
            component: () => import("@/views/task-management/SharedTask-page2.vue"),
            meta: {
              title: "任务",
              hidden: true // 保持隐藏
            }
          },
          {
            path: "private",
            name: "PrivateTaskPage1",
            component: () => import("@/views/task-management/PrivateTask-page1.vue"),
            meta: { title: "私有项目" }
          },
          {
            path: "private/:projectId", // 修改为这种格式
            name: "PrivateTaskPage2",
            component: () => import("@/views/task-management/PrivateTask-page2.vue"),
            meta: {
              title: "任务",
              hidden: true
            }
          }
        ]
      },
      {
        path: "data-management",
        component: () => import("@/views/data-management/index.vue"),
        name: "DataManagement",
        meta: { title: "数据管理", svgIcon: "data-management" }
      },
      /*  {
        path: "permission-management",
        component: () => import("@/views/permission-management/index.vue"),
        name: "PermissionManagement",
        meta: { title: "权限管理", roles: ["admin"], svgIcon: "permission-management" }
      },
      {
        path: "user-management",
        component: () => import("@/views/user-management/index.vue"),
        name: "UserManagement",
        meta: { title: "用户信息管理", roles: ["admin"], svgIcon: "user-management" }
      }, */
      {
        path: "simulation",
        name: "Simulation",
        meta: { title: "仿真", svgIcon: "simulation" },
        children: [
          {
            path: "pre-processing",
            component: () => import("@/views/simulation/PreProcessing.vue"),
            name: "PreProcessing",
            meta: { title: "前处理模块" }
          },
          {
            path: "solver",
            component: () => import("@/views/simulation/Solver.vue"),
            name: "Solver",
            meta: { title: "求解器" }
          },
          {
            path: "post-processing",
            component: () => import("@/views/simulation/PostProcessing.vue"),
            name: "PostProcessing",
            meta: { title: "后处理模块" }
          }
        ]
      },
      {
        path: "personal-center",
        component: () => import("@/views/personal-center/index.vue"),
        name: "PersonalCenter",
        meta: { title: "个人中心", svgIcon: "personal-center", hidden: true }
      }
    ]
  }
]

/**
 * 动态路由
 * 用来放置有权限 (Roles 属性) 的路由
 * 必须带有 Name 属性
 */
export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: "/admin",
    component: Layouts,
    redirect: "/permission-management",
    meta: { title: "管理員功能", svgIcon: "dashboard", affix: true, roles: ["admin"] }, // 默认重定向到 dashboard
    children: [
      /*    {
        path: "dashboard",
        component: () => import("@/views/dashboard/index.vue"),
        name: "Dashboard",
        meta: { title: "管理員功能", svgIcon: "dashboard", affix: true, roles: ["admin"] },
        children: [
          // 添加管理员功能作为子路由，只有管理员能访问 */
      {
        path: "permission-management",
        component: () => import("@/views/permission-management/index.vue"),
        name: "PermissionManagement",
        meta: {
          title: "权限管理",
          roles: ["admin"], // 只有管理员可以访问
          svgIcon: "permission-management"
        }
      },
      {
        path: "user-management",
        component: () => import("@/views/user-management/index.vue"),
        name: "UserManagement",
        meta: {
          title: "用户信息管理",
          roles: ["admin"], // 只有管理员可以访问
          svgIcon: "user-management"
        }
      },
      {
        path: "organization-management",
        component: () => import("@/views/organization-management/index.vue"),
        name: "OrganizationManagement",
        meta: {
          title: "组织管理",
          roles: ["admin"], // 只有管理员可以访问
          svgIcon: "organization-management"
        }
      }
    ]
  },
  {
    path: "/:pathMatch(.*)*", // 必须将 'ErrorPage' 路由放在最后
    redirect: "/404",
    name: "ErrorPage",
    meta: {
      hidden: true
    }
  }
]

/* const router = createRouter({
  history,
  routes: routeSettings.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes
}) */
const router = createRouter({
  history,
  routes: [
    ...(routeSettings.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes), // 处理常驻路由
    ...asyncRoutes // 合并动态路由
  ]
})

/** 重置路由 */
export function resetRouter() {
  // 注意：所有动态路由路由必须带有 Name 属性，否则可能会不能完全重置干净
  try {
    router.getRoutes().forEach((route) => {
      const { name, meta } = route
      if (name && meta.roles?.length) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    // 强制刷新浏览器也行，只是交互体验不是很好
    window.location.reload()
  }
}

export default router
