import { hasAuth } from "@/router/utils";
import type { Directive, DirectiveBinding } from "vue";

function checkAuth(el: HTMLElement, value: string | Array<string>) {
  if (!value) {
    throw new Error(
      "[Directive: auth]: need auths! Like v-auth=\"['btn.add','btn.edit']\""
    );
  }
  el.style.display = hasAuth(value) ? "" : "none";
}

export const auth: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | Array<string>>) {
    checkAuth(el, binding.value);
  },
  updated(el: HTMLElement, binding: DirectiveBinding<string | Array<string>>) {
    checkAuth(el, binding.value);
  }
};
