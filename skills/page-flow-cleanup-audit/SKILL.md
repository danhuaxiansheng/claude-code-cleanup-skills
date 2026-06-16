---
name: page-flow-cleanup-audit
description: |
  通过追踪状态来源、业务不变量、查询、变更、权限、错误、重复计算和防御代码，审计并清理页面、功能流、组件。用于前端清理、页面清理、功能流清理、source-of-truth 审计、query/mutation 清理、权限/错误状态审查、防御 UI 移除和持续深度清理。
---

# 页面流程清理审计

## 原则

从第一性原则开始：确认页面目的、它依赖的事实，以及必须保持为真的业务不变量。不要从机械去重或删除 optional check 开始。

好的清理会移除多余 source of truth 和无意义分支，同时保留真实的 loading、empty、error、permission 和 lifecycle 状态。

当清理可能改变用户可见行为时使用本技能。它用于区分无意义防御代码和真实的生命周期、权限、错误、空态。

不要把注释当作清理目标。只有注释错误、因代码变更过期，或描述了已删除行为时才更新。

不要在清理一个组件或 helper 后停止。对于用户请求的页面或流程，必须追踪完整流程边界和影响面后再报告完成。

本技能属于三个清理技能之一：

- 用 `page-flow-cleanup-audit` 处理用户可见流程、状态所有权和业务不变量。
- 用 `necessary-code-audit` 判断 wrapper、兼容、fallback、默认值和防御代码是否必要。
- 用 `unused-code-audit` 证明删除的 helper、export 和文件是否仍有消费者。

## 工作流

### 1. 定义流程边界

- 命名页面/文件/功能及其用户可见目的。
- 识别入口：用户入口、主组件或 handler、hook、query helper、mutation helper、store、dialog 和外部消费者。
- 区分主流程和相邻可复用业务面。不要因为 UI 看起来相似就合并。
- 如果请求包含“无需向后兼容”或“删除防御代码”，只应用到兼容层或不可能状态 guard，不应用到真实可空业务状态。
- 建立影响面图：route、共享包、store、query key、API client、analytics event、native/web 消费者、测试/脚本，以及被流程触达的下游 app/package。

深度要求：编辑前检查边界内每个文件；每个被修改的共享 helper/type/store/query，都要检查代表性下游消费者。不要依赖单个 grep 结果或一个明显调用点。

### 2. 找到 Source Of Truth

按以下顺序追踪状态：

1. Server/API contract。
2. Query key 和 query function。
3. Mutation 后的 query cache invalidation。
4. Local store 或 component state。
5. 派生计算。
6. UI adapter 和 presentation。

危险信号：

- 多个 query 获取同一个业务事实。
- store 和 React Query 同时宣称拥有同一个远程状态。
- mutation 在多个组件里直接 invalidate 原始 key。
- “轻量 query” 复制同一个 API 来源，制造第二份 cache。
- component-local count/status 来自过期或独立 source。

推荐形态：

- 一个 query helper 拥有一个远程事实。
- mutation 调用一个共享 invalidation helper。
- 除非后端有真实 count endpoint，否则 count 和 label 从 canonical query 派生。
- response type 表达边界后的保证，而不是在 UI 增加 guard。

### 3. 分类重复逻辑

只有确定性且业务等价的逻辑才抽取。

适合抽取：

- 产品/分类分组。
- 过滤和排序。
- 时间序列或组合收益派生。
- 资格判断。
- Query-key projection helper。
- 类型层面的请求/响应边界 helper。

不要抽取：

- 布局、密度、折叠行为、移动端/桌面端交互、toolbar 组合或 route-specific loading 决策。
- 看起来相似但上下文或用户流程不同的 UI 代码。
- 只隐藏两个调用点、却不减少业务复杂度的组件 wrapper。

### 4. 分类防御代码

满足以下情况时可删除为无意义：

- prop 或边界类型已经保证值存在。
- 布尔参数总是作为常量传入。
- helper 只包装空对象或显然的字面量。
- fallback 只服务旧数据格式，且用户明确不再兼容。
- `as any` 隐藏了可通过收紧边界解决的类型问题。
- 可选链违背 required prop，只会弱化错误。

满足以下情况时必须保留：

- 领域类型确实可选，例如可选 expiration、可选 strategy item、缺失 profile data、未选中 row。
- 分支代表真实 loading、empty、error、permission 或 access 状态。
- fallback 是有意的用户体验降级，例如截图分享失败后退回链接分享。
- 值来自外部输入，缺失仍是合法业务行为。

如果值只在成功边界之前可选，应创建更窄的 response type，而不是在 UI 加 guard。

### 5. 安全清理顺序

1. 先删除过时 source-of-truth 路径。
2. 增加或复用共享 invalidation helper。
3. 抽取纯计算 helper。
4. 用 helper 替换重复本地派生。
5. 收紧请求/响应边界类型。
6. 删除无意义 guard、`as any`、空 fallback helper 和恒定参数。
7. 只保留影响结果的字段来简化 query key。
8. 每次删除 source 或 helper 后重新搜索残留。

不要“以防万一”做数据规范化。保持外科式编辑，并绑定到被审计流程。

不要把精力花在注释清理上，除非注释已经过期、误导或因代码编辑而孤立。

### 6. 完成门槛

报告完成前必须：

1. 重新检查完整流程边界，而不仅是已编辑文件。
2. 搜索删除符号、旧 query/store 名称、旧 source path、重复字面量、`as any`、恒定参数，以及与 required type 冲突的可选链。
3. 确认剩余防御分支都是真实 loading、empty、error、permission、lifecycle、external-input 或领域可空状态。
4. 确认修改过的共享 helper/type 已有下游验证覆盖。
5. 说明有意不动的候选及原因。

## 证据链

结构证据：

- 页面或功能文件清单。
- component、hook、helper、store、query、mutation 和 route entrypoint 的 import/export 搜索。
- manifest、公共入口、生成文件、类型声明和框架约定。
- 可用时使用语言工具：编译诊断、测试覆盖、依赖分析或 IDE 引用。
- 对共享 helper、store、query key 和公共类型检查代表性调用方。
- 检查 workspace manifest，选择受影响的下游检查。

文本残留搜索：

- 旧 store 名。
- 旧 query helper 和 key。
- 删除的 helper 名。
- 恒定参数。
- `as any`。
- required prop 上的可选链。
- 兼容注释或旧格式分支。

搜索定义位置和每个可能消费者根目录，不只搜索被编辑文件或目录。

## 验证

运行覆盖改动边界的最窄检查：

- 导出 query/type 改动时跑 package build。
- 本地 component/helper 改动时跑 package typecheck。
- 触碰公共 import 时跑受影响 app 或 consumer typecheck。
- 清理改变用户可见状态、query 行为、权限或 mutation invalidation 时，跑流程级 smoke 或聚焦测试。
- 对删除符号和旧 source path 做残留 `rg`。
- `git diff --check`。

如果下游消费者读取生成产物或声明文件，先按依赖顺序 rebuild，再判断下游类型错误。

## 报告

报告：

- Source-of-truth 变更。
- 抽取的纯 helper 和删除的重复逻辑。
- 删除的防御代码，以及保留的真实 nullable 状态。
- 收紧的类型边界。
- 残留搜索和验证命令。
- 未触碰的无关 dirty 文件。

需要反驳时明确说明：“这不是防御代码，而是真实的业务空态/错误态/权限态/生命周期状态。”
