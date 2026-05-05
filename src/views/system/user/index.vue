<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">用户管理</span>
          <div class="search-area">
            <el-form :inline="true" class="search-form">
              <el-form-item label="关键词">
                <el-input
                  v-model="keyword"
                  placeholder="用户名/昵称/手机号"
                  clearable
                  style="width: 180px"
                  @keyup.enter="handleSearch"
                />
              </el-form-item>
              <el-form-item label="状态">
                <el-select
                  v-model="status"
                  placeholder="全部"
                  clearable
                  style="width: 100px"
                >
                  <el-option label="启用" :value="1" />
                  <el-option label="禁用" :value="2" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button
                  type="primary"
                  :icon="useRenderIcon(Search)"
                  @click="handleSearch"
                >
                  搜索
                </el-button>
                <el-button :icon="useRenderIcon(Refresh)" @click="handleReset">
                  重置
                </el-button>
              </el-form-item>
            </el-form>
            <el-button
              type="primary"
              :icon="useRenderIcon(AddFill)"
              @click="handleAdd"
            >
              新增用户
            </el-button>
          </div>
        </div>
      </template>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="dataList"
        border
        stripe
        highlight-current-row
      >
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
            <template v-if="col.slot === 'role'">
              {{ row.role?.roleName || "-" }}
            </template>
            <template v-else-if="col.slot === 'status'">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                {{ row.status === 1 ? "启用" : "禁用" }}
              </el-tag>
            </template>
            <template v-else-if="col.slot === 'operation'">
              <el-button
                v-if="row.username !== 'admin'"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                link
                type="warning"
                :icon="useRenderIcon(Key)"
                @click="handleResetPassword(row)"
              >
                重置密码
              </el-button>
              <el-button
                v-if="row.username !== 'admin'"
                link
                type="danger"
                :icon="useRenderIcon(Delete)"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
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

      <!-- 弹窗表单 -->
      <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="600px"
        destroy-on-close
      >
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="80px"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="formData.username"
              placeholder="请输入用户名"
              :disabled="!!formData.id"
            />
          </el-form-item>
          <el-form-item label="密码" prop="password" :required="!formData.id">
            <el-input
              v-model="formData.password"
              type="password"
              placeholder="请输入密码"
              show-password
            />
          </el-form-item>
          <el-form-item label="昵称">
            <el-input v-model="formData.nickname" placeholder="请输入昵称" />
          </el-form-item>
          <el-form-item label="角色" prop="roleId">
            <el-select
              v-model="formData.roleId"
              placeholder="请选择角色"
              style="width: 100%"
            >
              <el-option
                v-for="role in roleList"
                :key="role.id"
                :label="role.roleName"
                :value="role.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="formData.phone" placeholder="请输入手机号" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="formData.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="状态">
            <el-radio-group v-model="formData.status">
              <el-radio :value="1">启用</el-radio>
              <el-radio :value="2">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  getRoleOptions,
  type UserInfo,
  type RoleInfo
} from "@/api/system";
import { ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import Key from "~icons/ep/key";

// 密码正则（密码格式应为8-18位数字、字母、符号的任意两种组合）
const REGEXP_PWD =
  /^(?![0-9]+$)(?![a-z]+$)(?![A-Z]+$)(?!([^(0-9a-zA-Z)]|[()])+$)(?!^.*[\u4E00-\u9FA5].*$)([^(0-9a-zA-Z)]|[()]|[a-z]|[A-Z]|[0-9]){8,18}$/;

defineOptions({ name: "SystemUser" });

const loading = ref(false);
const dataList = ref<UserInfo[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const keyword = ref("");
const status = ref<number | null>(null);

const dialogVisible = ref(false);
const dialogTitle = ref("");
const formRef = ref<FormInstance>();
const formData = reactive<Partial<UserInfo> & { password?: string }>({
  id: undefined,
  username: "",
  password: "",
  nickname: "",
  email: "",
  phone: "",
  roleId: undefined as any,
  status: 1
});

const roleList = ref<RoleInfo[]>([]);

const rules: FormRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [
    {
      required: true,
      message: "请输入密码",
      trigger: "blur",
      validator: (rule, value, callback) => {
        if (formData.id && (!value || value === "")) {
          callback();
          return;
        }
        if (!formData.id && (!value || value === "")) {
          callback(new Error("请输入密码"));
          return;
        }
        if (value && !REGEXP_PWD.test(value)) {
          callback(
            new Error("密码格式应为8-18位数字、字母、符号的任意两种组合")
          );
        } else {
          callback();
        }
      }
    }
  ],
  roleId: [{ required: true, message: "请选择角色", trigger: "change" }]
};

const columns = [
  { label: "ID", prop: "id", width: 80 },
  { label: "用户名", prop: "username", minWidth: 120 },
  { label: "昵称", prop: "nickname", minWidth: 120 },
  { label: "角色", prop: "role", minWidth: 120, slot: "role" },
  { label: "手机号", prop: "phone", minWidth: 120 },
  { label: "邮箱", prop: "email", minWidth: 180 },
  { label: "状态", prop: "status", width: 100, slot: "status" },
  { label: "创建时间", prop: "createdAt", minWidth: 180 },
  { label: "操作", fixed: "right", width: 260, slot: "operation" }
];

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getUserList({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      status: status.value ?? undefined
    });
    if (res.code === 200) {
      dataList.value = res.data.list;
      total.value = res.data.total;
    }
  } finally {
    loading.value = false;
  }
};

const fetchRoleList = async () => {
  const res = await getRoleOptions();
  if (res.code === 200) {
    roleList.value = res.data;
  }
};

const handleAdd = () => {
  dialogTitle.value = "新增用户";
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row: UserInfo) => {
  dialogTitle.value = "编辑用户";
  Object.assign(formData, row);
  formData.password = "";
  dialogVisible.value = true;
};

const handleDelete = (row: UserInfo) => {
  ElMessageBox.confirm(`确定删除用户 "${row.username}" 吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    const res = await deleteUser(row.id);
    if (res.code === 200) {
      message("删除成功", { type: "success" });
      fetchData();
    } else {
      message(res.message, { type: "error" });
    }
  });
};

// 重置密码
const handleResetPassword = (row: UserInfo) => {
  ElMessageBox.prompt(`请输入用户 "${row.username}" 的新密码`, "重置密码", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputType: "password",
    inputValidator: value => {
      if (!value) {
        return "请输入密码";
      }
      if (!REGEXP_PWD.test(value)) {
        return "密码格式应为8-18位数字、字母、符号的任意两种组合";
      }
      return true;
    }
  }).then(async ({ value }) => {
    const res = await updateUser({ id: row.id, password: value });
    if (res.code === 200) {
      message("密码重置成功", { type: "success" });
    } else {
      message(res.message, { type: "error" });
    }
  });
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async valid => {
    if (valid) {
      if (formData.id) {
        const data = { ...formData };
        delete data.password;
        const res = await updateUser(data);
        if (res.code === 200) {
          message("修改成功", { type: "success" });
          dialogVisible.value = false;
          fetchData();
        } else {
          message(res.message, { type: "error" });
        }
      } else {
        const res = await createUser(formData as any);
        if (res.code === 200) {
          message("添加成功", { type: "success" });
          dialogVisible.value = false;
          fetchData();
        } else {
          message(res.message, { type: "error" });
        }
      }
    }
  });
};

const resetForm = () => {
  formData.id = undefined;
  formData.username = "";
  formData.password = "";
  formData.nickname = "";
  formData.email = "";
  formData.phone = "";
  formData.roleId = undefined;
  formData.status = 1;
  formRef.value?.resetFields();
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchData();
};

const handleReset = () => {
  keyword.value = "";
  status.value = null;
  currentPage.value = 1;
  fetchData();
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  fetchData();
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchData();
};

onMounted(() => {
  fetchData();
  fetchRoleList();
});
</script>

<style scoped lang="scss">
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

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
