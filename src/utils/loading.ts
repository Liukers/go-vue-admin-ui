import { ElLoading } from "element-plus";
import type { LoadingInstance } from "element-plus";

let loadingInstance: LoadingInstance | null = null;
let loadingCount = 0;

/**
 * 显示全屏 Loading
 * @param text 加载提示文字
 */
export function showLoading(text = "加载中...") {
  if (loadingCount === 0) {
    loadingInstance = ElLoading.service({
      lock: true,
      text,
      background: "rgba(0, 0, 0, 0.3)"
    });
  }
  loadingCount++;
}

/**
 * 隐藏全屏 Loading
 */
export function hideLoading() {
  if (loadingCount > 0) {
    loadingCount--;
  }
  if (loadingCount === 0 && loadingInstance) {
    loadingInstance.close();
    loadingInstance = null;
  }
}

/**
 * 强制关闭所有 Loading（用于异常处理）
 */
export function forceHideLoading() {
  loadingCount = 0;
  if (loadingInstance) {
    loadingInstance.close();
    loadingInstance = null;
  }
}
