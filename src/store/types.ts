import type { RouteRecordName } from "vue-router";

export type CacheType = {
  mode: string;
  name?: RouteRecordName;
};

export type PositionType = {
  startIndex?: number;
  length?: number;
};

export type AppType = {
  sidebar: {
    opened: boolean;
    withoutAnimation: boolean;
    // 是否手动点击了折叠按钮
    isClickCollapse: boolean;
  };
  layout: string;
  device: string;
  viewportSize: { width: number; height: number };
};

export type MultiType = {
  path: string;
  name: string;
  meta: any;
  query?: object;
  params?: object;
};

export type SetType = {
  title: string;
  fixedHeader: boolean;
  hiddenSideBar: boolean;
};

export type UserType = {
  avatar?: string;
  username?: string;
  nickname?: string;
  roles?: Array<string>;
  permissions?: Array<string>;
  isRemembered?: boolean;
  loginDay?: number;
};
