<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">操作日志</span>
          <div class="search-area">
            <el-form :inline="true" :model="searchForm" class="search-form">
              <el-form-item label="用户名">
                <el-input
                  v-model="searchForm.username"
                  placeholder="请输入用户名"
                  clearable
                  style="width: 140px"
                />
              </el-form-item>
              <el-form-item label="状态">
                <el-select
                  v-model="searchForm.status"
                  placeholder="请选择状态"
                  clearable
                  style="width: 110px"
                >
                  <el-option label="成功" :value="1" />
                  <el-option label="失败" :value="2" />
                </el-select>
              </el-form-item>
              <el-form-item label="开始时间">
                <el-date-picker
                  v-model="searchForm.startTime"
                  type="date"
                  placeholder="选择开始时间"
                  value-format="YYYY-MM-DD"
                  style="width: 135px"
                />
              </el-form-item>
              <el-form-item label="结束时间">
                <el-date-picker
                  v-model="searchForm.endTime"
                  type="date"
                  placeholder="选择结束时间"
                  value-format="YYYY-MM-DD"
                  style="width: 135px"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleSearch">搜索</el-button>
                <el-button @click="handleReset">重置</el-button>
              </el-form-item>
            </el-form>
            <el-button type="danger" @click="handleClear">清空日志</el-button>
          </div>
        </div>
      </template>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="dataList" border stripe row-key="id">
        <el-table-column
          v-for="col in columns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
        >
          <template #default="{ row }">
            <template v-if="col.slot === 'status'">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                {{ row.status === 1 ? "成功" : "失败" }}
              </el-tag>
            </template>
            <template v-else-if="col.slot === 'operation'">
              <div class="operation-buttons">
                <el-button
                  link
                  type="primary"
                  :icon="useRenderIcon(Eye)"
                  @click="handleViewDetail(row)"
                >
                  详情
                </el-button>
                <el-button
                  link
                  type="danger"
                  :icon="useRenderIcon(Delete)"
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
              </div>
            </template>
            <template v-else>
              {{ row[col.prop] || "-" }}
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <!-- 详情弹窗 -->
      <el-dialog
        v-model="detailVisible"
        title="操作日志详情"
        width="750px"
        destroy-on-close
        :close-on-click-modal="false"
        class="log-detail-dialog"
        align-center
      >
        <el-descriptions
          v-if="currentDetail"
          :column="2"
          border
          class="log-descriptions"
        >
          <el-descriptions-item label="ID">{{
            currentDetail.id
          }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{
            currentDetail.username
          }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{
            currentDetail.roleName
          }}</el-descriptions-item>
          <el-descriptions-item label="请求方法">
            <el-tag
              :type="getMethodType(currentDetail.method)"
              size="small"
              effect="light"
              class="method-tag"
            >
              {{ currentDetail.method }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="请求路径" :span="2">
            <div class="text-wrap">{{ currentDetail.path }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentDetail.status === 1 ? 'success' : 'danger'">
              {{ currentDetail.status === 1 ? "成功" : "失败" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">{{
            currentDetail.ip
          }}</el-descriptions-item>
          <el-descriptions-item label="耗时(ms)">{{
            currentDetail.operationTime
          }}</el-descriptions-item>
          <el-descriptions-item label="操作时间">{{
            currentDetail.createdAt
          }}</el-descriptions-item>
          <el-descriptions-item label="请求数据" :span="2">
            <pre
              class="json-content"
            ><code class="json-code">{{ formatJson(currentDetail.requestData) }}</code></pre>
          </el-descriptions-item>
          <el-descriptions-item label="响应数据" :span="2">
            <pre
              class="json-content"
            ><code class="json-code">{{ formatJson(currentDetail.responseData) }}</code></pre>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="currentDetail.errorMessage"
            label="错误信息"
            :span="2"
          >
            <span class="error-text">{{ currentDetail.errorMessage }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="User-Agent" :span="2">
            <div class="text-wrap">{{ currentDetail.userAgent || "-" }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "@/utils/message";
import {
  getOperationLogList,
  deleteOperationLog,
  clearOperationLog,
  type OperationLogInfo
} from "@/api/system";
import { ElMessageBox } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Eye from "~icons/ri/eye-line";
import Delete from "~icons/ep/delete";

defineOptions({
  name: "OperationLog"
});

const loading = ref(false);
const dataList = ref<OperationLogInfo[]>([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

const searchForm = reactive({
  username: "",
  status: undefined as number | undefined,
  startTime: "",
  endTime: ""
});

const columns = [
  { label: "ID", prop: "id", width: 80 },
  { label: "用户名", prop: "username", minWidth: 100 },
  { label: "角色", prop: "roleName", minWidth: 100 },
  { label: "请求方法", prop: "method", width: 100 },
  { label: "请求路径", prop: "path", minWidth: 180 },
  { label: "状态", prop: "status", width: 80, slot: "status" },
  { label: "IP地址", prop: "ip", width: 130 },
  { label: "耗时(ms)", prop: "operationTime", width: 100 },
  { label: "操作时间", prop: "createdAt", minWidth: 160 },
  { label: "操作", fixed: "right", width: 160, slot: "operation" }
];

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getOperationLogList({
      page: currentPage.value,
      pageSize: pageSize.value,
      username: searchForm.username || undefined,
      status: searchForm.status,
      startTime: searchForm.startTime || undefined,
      endTime: searchForm.endTime || undefined
    });
    if (res.code === 200) {
      dataList.value = res.data.list;
      total.value = res.data.total;
    } else {
      message(res.message, { type: "error" });
    }
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchData();
};

const handleReset = () => {
  searchForm.username = "";
  searchForm.status = undefined;
  searchForm.startTime = "";
  searchForm.endTime = "";
  currentPage.value = 1;
  fetchData();
};

const handleDelete = (row: OperationLogInfo) => {
  ElMessageBox.confirm(`确定删除该操作日志吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    const res = await deleteOperationLog(row.id);
    if (res.code === 200) {
      message("删除成功", { type: "success" });
      fetchData();
    } else {
      message(res.message, { type: "error" });
    }
  });
};

const handleClear = () => {
  ElMessageBox.confirm(`确定清空所有操作日志吗？此操作不可恢复！`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    const res = await clearOperationLog();
    if (res.code === 200) {
      message("清空成功", { type: "success" });
      fetchData();
    } else {
      message(res.message, { type: "error" });
    }
  });
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  fetchData();
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchData();
};

const detailVisible = ref(false);
const currentDetail = ref<OperationLogInfo | null>(null);

const handleViewDetail = (row: OperationLogInfo) => {
  currentDetail.value = row;
  detailVisible.value = true;
};

// 递归解析嵌套的 JSON 字符串（处理双重转义）
const deepParseJson = (value: any): any => {
  if (typeof value === "string") {
    // 先处理双重转义的字符串（如 \" 转换为 ", \/ 转换为 /）
    let unescaped = value;
    // 处理 Unicode 转义（如 \u0026 转换为 &）
    unescaped = unescaped.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );

    // 尝试解析为 JSON
    try {
      const parsed = JSON.parse(unescaped);
      // 如果解析成功且结果不同，递归处理
      if (parsed !== unescaped) {
        return deepParseJson(parsed);
      }
      return unescaped;
    } catch {
      // 不是有效的 JSON，返回解转义后的值
      return unescaped;
    }
  } else if (Array.isArray(value)) {
    return value.map(item => deepParseJson(item));
  } else if (value !== null && typeof value === "object") {
    const result: any = {};
    for (const key in value) {
      result[key] = deepParseJson(value[key]);
    }
    return result;
  }
  return value;
};

// 格式化 JSON 数据（递归解析嵌套 JSON）
const formatJson = (data: string | undefined): string => {
  if (!data || data === "-" || data === "[日志列表数据省略]")
    return data || "-";
  try {
    // 先处理原始字符串中的转义（如 \" 转换为 "）
    let processed = data;
    // 如果是已经被 JSON.stringify 过的字符串（如从 Go 后端返回）
    // 需要先处理双重转义
    if (data.startsWith('"') && data.endsWith('"')) {
      try {
        processed = JSON.parse(data);
      } catch {
        // 解析失败，保持原样
      }
    }

    // 解析为 JSON 对象
    let parsed = JSON.parse(processed);
    // 递归解析嵌套的 JSON 字符串
    parsed = deepParseJson(parsed);
    // 格式化输出（保留 2 空格缩进）
    return JSON.stringify(parsed, null, 2);
  } catch {
    // 解析失败，返回原始数据
    return data;
  }
};

// JSON 语法高亮
const highlightJson = (json: string): string => {
  if (!json || json === "-") return json;

  return (
    json
      // 转义 HTML 特殊字符
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // 高亮字符串（包括键名）
      .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="json-string">$1</span>')
      // 高亮数字
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="json-number">$1</span>')
      // 高亮布尔值
      .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
      // 高亮 null
      .replace(/\b(null)\b/g, '<span class="json-null">$1</span>')
  );
};

// 获取请求方法的标签类型
const getMethodType = (
  method: string
): "primary" | "success" | "warning" | "danger" | "info" => {
  const typeMap: Record<
    string,
    "primary" | "success" | "warning" | "danger" | "info"
  > = {
    GET: "success",
    POST: "primary",
    PUT: "warning",
    DELETE: "danger",
    PATCH: "info"
  };
  return typeMap[method?.toUpperCase()] || "info";
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.card-header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.search-area {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
}

.search-form :deep(.el-form-item) {
  margin-right: 10px;
  margin-bottom: 0;
}

.operation-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 弹窗样式 */
:deep(.log-detail-dialog) {
  max-width: 90vw;
  border-radius: 8px;
}

:deep(.log-detail-dialog .el-dialog__header) {
  padding: 16px 20px;
  margin: 0;
  border-bottom: 1px solid var(--el-border-color);
}

:deep(.log-detail-dialog .el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
}

:deep(.log-detail-dialog .el-dialog__body) {
  max-height: 75vh;
  padding: 20px;
  overflow-y: auto;
}

:deep(.log-descriptions .el-descriptions__cell) {
  vertical-align: top;
  word-break: break-all;
}

:deep(.log-descriptions .el-descriptions__label) {
  width: 100px;
  min-width: 100px;
  font-weight: 500;
  background-color: var(--el-fill-color-light);
}

:deep(.log-descriptions .el-descriptions__content) {
  background-color: var(--el-bg-color);
}

.text-wrap {
  line-height: 1.5;
  word-break: break-all;
  white-space: pre-wrap;
}

.json-content {
  max-height: 250px;
  padding: 12px;
  margin: 0;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
  word-break: break-all;
  white-space: pre-wrap;
  background: #1e1e1e;
  border-radius: 6px;
}

.json-code {
  font-family: Consolas, Monaco, "Courier New", monospace;
  color: #d4d4d4;
}

/* JSON 语法高亮 - VS Code 暗色主题风格 */
.json-content .json-string {
  color: #ce9178;
}

.json-content .json-number {
  color: #b5cea8;
}

.json-content .json-boolean {
  color: #569cd6;
}

.json-content .json-null {
  color: #569cd6;
}

.error-text {
  display: block;
  padding: 8px 12px;
  color: var(--el-color-danger);
  word-break: break-all;
  background: var(--el-color-danger-light-9);
  border-radius: 4px;
}

.method-tag {
  font-family: Consolas, Monaco, monospace;
  font-weight: 600;
}
</style>
