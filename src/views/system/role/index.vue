<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">角色管理</span>
          <div class="search-area">
            <el-form :inline="true" class="search-form">
              <el-form-item label="关键词">
                <el-input
                  v-model="keyword"
                  placeholder="角色名称/角色代码"
                  clearable
                  style="width: 180px"
                  @keyup.enter="handleSearch"
                />
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
              v-perms="'system:role:add'"
              type="primary"
              :icon="useRenderIcon(AddFill)"
              @click="handleAdd"
            >
              新增角色
            </el-button>
          </div>
        </div>
      </template>

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
            <template v-if="col.slot === 'status'">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                {{ row.status === 1 ? "启用" : "禁用" }}
              </el-tag>
            </template>
            <template v-else-if="col.slot === 'operation'">
              <el-button
                v-if="row.roleCode !== 'admin'"
                v-perms="'system:role:edit'"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="row.roleCode !== 'admin'"
                v-perms="'system:role:assign'"
                link
                type="success"
                :icon="useRenderIcon(MenuIcon)"
                @click="handlePermission(row)"
              >
                权限
              </el-button>
              <el-button
                v-if="row.roleCode !== 'admin'"
                v-perms="'system:role:delete'"
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
          label-width="100px"
        >
          <el-form-item label="角色名称" prop="roleName">
            <el-input
              v-model="formData.roleName"
              placeholder="请输入角色名称"
            />
          </el-form-item>
          <el-form-item label="角色代码" prop="roleCode">
            <el-input
              v-model="formData.roleCode"
              placeholder="请输入角色代码"
              :disabled="!!formData.id"
            />
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入角色描述"
            />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="formData.sort" :min="0" />
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

      <el-dialog
        v-model="permDialogVisible"
        :title="permDialogTitle"
        width="500px"
        destroy-on-close
      >
        <div class="menu-tree-container">
          <el-tree
            ref="menuTreeRef"
            :data="menuTreeData"
            :props="defaultProps"
            node-key="id"
            show-checkbox
            default-expand-all
            @check="handleTreeCheck"
          />
        </div>
        <template #footer>
          <el-button @click="permDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSavePermission"
            >确定</el-button
          >
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from "vue";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useCrudPage } from "@/hooks/useCrudPage";
import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  getRoleMenus,
  setRoleMenus,
  getMenuTree,
  type RoleInfo,
  type MenuInfo
} from "@/api/system";
import { ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import MenuIcon from "~icons/ep/menu";

defineOptions({ name: "SystemRole" });

const keyword = ref("");

const {
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
} = useCrudPage<RoleInfo>({
  fetchApi: getRoleList,
  buildParams: () => ({
    keyword: keyword.value || undefined
  })
});

const formRef = ref<FormInstance>();
const formData = reactive<Partial<RoleInfo>>({
  id: undefined,
  roleName: "",
  roleCode: "",
  description: "",
  sort: 0,
  status: 1
});

const permDialogVisible = ref(false);
const permDialogTitle = ref("");
const currentRoleId = ref<number>(0);
const menuTreeData = ref<MenuInfo[]>([]);
const checkedMenuIds = ref<number[]>([]);
const menuTreeRef = ref<any>(null);
const defaultProps = {
  children: "children",
  label: "menuName"
};

const rules: FormRules = {
  roleName: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  roleCode: [{ required: true, message: "请输入角色代码", trigger: "blur" }]
};

const columns = [
  { label: "ID", prop: "id", width: 80 },
  { label: "角色名称", prop: "roleName", minWidth: 150 },
  { label: "角色代码", prop: "roleCode", minWidth: 150 },
  { label: "描述", prop: "description", minWidth: 200 },
  { label: "排序", prop: "sort", width: 100 },
  { label: "状态", prop: "status", width: 100, slot: "status" },
  { label: "创建时间", prop: "createdAt", minWidth: 180 },
  { label: "操作", fixed: "right", width: 280, slot: "operation" }
];

const handleAdd = () => {
  dialogTitle.value = "新增角色";
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row: RoleInfo) => {
  dialogTitle.value = "编辑角色";
  Object.assign(formData, row);
  dialogVisible.value = true;
};

const handlePermission = async (row: RoleInfo) => {
  currentRoleId.value = row.id;
  permDialogTitle.value = `设置权限 - ${row.roleName}`;

  const menuRes = await getMenuTree();
  if (menuRes.code === 200) {
    menuTreeData.value = menuRes.data;
  }

  const roleMenuRes = await getRoleMenus(row.id);

  permDialogVisible.value = true;

  // 注意：setCheckedKeys 的 leafOnly 模式遇到非叶子 key 会先深选其整个子树，
  // 因此只能传叶子 key（父级 id 入库是策略生成所需，不能直接回填给树）
  if (roleMenuRes.code === 200) {
    nextTick(() => {
      const keys: number[] = roleMenuRes.data || [];
      const leafKeys = keys.filter(key => {
        const node = menuTreeRef.value?.getNode(key);
        return node?.isLeaf;
      });
      menuTreeRef.value?.setCheckedKeys(leafKeys, true);
    });
  }
};

const handleTreeCheck = (nodeData: MenuInfo) => {
  const tree = menuTreeRef.value;
  if (!tree) return;

  const node = tree.getNode(nodeData.id);
  if (!node || nodeData.menuType !== 3) return;

  const isView = nodeData.perm?.endsWith(":view");

  if (isView && !node.checked) {
    // 取消“查看”时，应同时取消同菜单下的所有操作按钮
    node.parent?.childNodes.forEach((child: any) => {
      if (
        child.data.id !== nodeData.id &&
        child.data.menuType === 3 &&
        child.checked
      ) {
        tree.setChecked(child.data.id, false, false);
      }
    });
  } else if (!isView && node.checked) {
    // 勾选操作按钮时，必须同时勾选同菜单下的“查看”按钮
    const viewSibling = node.parent?.childNodes.find((child: any) =>
      child.data.perm?.endsWith(":view")
    );
    if (viewSibling && !viewSibling.checked) {
      tree.setChecked(viewSibling.data.id, true, false);
    }
  }
};

const handleSavePermission = async () => {
  if (!menuTreeRef.value) return;

  // 全选节点（含全选的目录/菜单）与半选节点一并保存。
  // 不能只保存叶子节点：全选的父节点会被漏掉，菜单本体不授权，
  // 角色会"能看到菜单却没有查看权限"
  const checkedKeys = menuTreeRef.value.getCheckedKeys(false);
  const halfKeys = menuTreeRef.value.getHalfCheckedKeys();

  const res = await setRoleMenus({
    roleId: currentRoleId.value,
    menuIds: [...new Set([...checkedKeys, ...halfKeys])]
  });

  if (res.code === 200) {
    message("权限设置成功", { type: "success" });
    permDialogVisible.value = false;
  } else {
    message(res.message, { type: "error" });
  }
};

const handleDelete = (row: RoleInfo) => {
  ElMessageBox.confirm(`确定删除角色 "${row.roleName}" 吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    const res = await deleteRole(row.id);
    if (res.code === 200) {
      message("删除成功", { type: "success" });
      fetchData();
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
        const res = await updateRole(formData);
        if (res.code === 200) {
          message("修改成功", { type: "success" });
          dialogVisible.value = false;
          fetchData();
        } else {
          message(res.message, { type: "error" });
        }
      } else {
        const res = await createRole(formData);
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
  formData.roleName = "";
  formData.roleCode = "";
  formData.description = "";
  formData.sort = 0;
  formData.status = 1;
  formRef.value?.resetFields();
};

const handleReset = () => {
  keyword.value = "";
  currentPage.value = 1;
  fetchData();
};
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

.menu-tree-container {
  max-height: 400px;
  overflow-y: auto;
}
</style>
