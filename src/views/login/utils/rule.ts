import { reactive } from "vue";
import type { FormRules } from "element-plus";

const loginRules = reactive<FormRules>({
  // 登录只校验非空，不校验密码强度（历史密码可能不符合现行强度规则，强度校验只用于改密场景）
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  captchaCode: [
    {
      required: true,
      message: "请输入验证码",
      trigger: "blur"
    }
  ]
});

export { loginRules };
