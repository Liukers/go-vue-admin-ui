import { ref, onMounted, type Ref } from "vue";
import { message } from "@/utils/message";

/** 列表接口响应结构（与后端分页结构对应，仅约束 hook 依赖的字段） */
interface FetchResult<T> {
  code: number;
  message: string;
  data: {
    list: T[];
    total: number;
  };
}

interface UseCrudPageOptions<T> {
  /** 列表查询接口，分页参数 `page`/`pageSize` 由 hook 自动注入 */
  fetchApi: (params: Record<string, any>) => Promise<FetchResult<T>>;
  /** 组装页面特有的查询参数（搜索表单字段等） */
  buildParams?: () => Record<string, any>;
  /** 接口返回非 200 时是否弹出错误提示（默认 `false`，静默忽略） */
  showFetchError?: boolean;
  /** 是否在 `onMounted` 时自动加载列表（默认 `true`） */
  immediate?: boolean;
}

/**
 * CRUD 列表页通用逻辑：加载状态、列表数据、分页、搜索、弹窗显隐
 * 页面特有部分（搜索表单字段、弹窗表单、列定义）仍留在页面中
 */
export function useCrudPage<T>(options: UseCrudPageOptions<T>) {
  const {
    fetchApi,
    buildParams,
    showFetchError = false,
    immediate = true
  } = options;

  const loading = ref(false);
  const dataList = ref<T[]>([]) as Ref<T[]>;
  const total = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(20);

  const dialogVisible = ref(false);
  const dialogTitle = ref("");

  const fetchData = async () => {
    loading.value = true;
    try {
      const res = await fetchApi({
        page: currentPage.value,
        pageSize: pageSize.value,
        ...(buildParams ? buildParams() : {})
      });
      if (res.code === 200) {
        // 后端空结果集会序列化为 null，统一兜底为空数组
        dataList.value = res.data.list ?? [];
        total.value = res.data.total;
      } else if (showFetchError) {
        message(res.message, { type: "error" });
      }
    } catch {
      // 网络/HTTP 层错误已由响应拦截器统一提示，此处仅防止 unhandledrejection
    } finally {
      loading.value = false;
    }
  };

  const handleSearch = () => {
    currentPage.value = 1;
    fetchData();
  };

  const handleSizeChange = (val: number) => {
    pageSize.value = val;
    // 切换每页条数时重置回第一页：
    // 否则当前页超出新页数边界时分页器会补发 current-change，产生双重请求竞态
    currentPage.value = 1;
    fetchData();
  };

  const handleCurrentChange = (val: number) => {
    currentPage.value = val;
    fetchData();
  };

  onMounted(() => {
    if (immediate) fetchData();
  });

  return {
    loading,
    dataList,
    total,
    currentPage,
    pageSize,
    dialogVisible,
    dialogTitle,
    fetchData,
    handleSearch,
    handleSizeChange,
    handleCurrentChange
  };
}
