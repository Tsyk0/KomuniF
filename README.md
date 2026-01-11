src/
├── apis/ # API 接口层
│ ├── auth/ # 认证相关 API
│ │ └── index.ts # 登录、注册等认证接口
│ ├── service.ts # Axios 实例配置和拦截器应用
│ └── index.ts # API 统一导出
├── assets/ # 静态资源
│ ├── images/ # 图片资源
│ ├── fonts/ # 字体文件
│ └── styles/ # 样式文件（未来扩展）
├── commons/ # 通用工具和公共模块
│ ├── interceptors/ # Axios 拦截器
│ │ ├── auth-interceptor.ts # 认证相关拦截器
│ │ └── index.ts # 拦截器统一导出
│ └── utils/ # 工具函数（预留）
├── components/ # 可复用 Vue 组件
│ ├── LoginForm.vue # 登录表单组件
│ └── RegisterForm.vue # 注册表单组件
├── entity/ # 数据实体定义
│ └── user.ts # 用户实体（对应后端数据库）
├── types/ # 类型定义分层
│ ├── flow/ # API 数据流类型
│ │ ├── auth.request.ts # 认证请求数据类型
│ │ └── auth.response.ts # 认证响应数据类型
│ └── form/ # 前端表单类型
│ └── auth.ts # UI 层表单类型定义
├── router/ # 路由配置
│ └── index.ts # 路由定义和守卫
├── stores/ # 状态管理（Pinia）
│ └── auth.ts # 认证状态管理
├── views/ # 页面级组件
│ ├── LoginView.vue # 登录页面
│ └── HomeView.vue # 主页
├── App.vue # 根组件
├── main.ts # 应用入口
└── env.d.ts # 环境变量类型声明
