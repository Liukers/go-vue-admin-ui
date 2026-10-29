import { hasPerms } from "@/utils/auth";
import type { Directive, DirectiveBinding } from "vue";

function checkPerms(el: HTMLElement, value: string | Array<string>) {
  if (!value) {
    throw new Error(
      "[Directive: perms]: need perms! Like v-perms=\"['btn.add','btn.edit']\""
    );
  }
  el.style.display = hasPerms(value) ? "" : "none";
}

export const perms: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | Array<string>>) {
    checkPerms(el, binding.value);
  },
  updated(el: HTMLElement, binding: DirectiveBinding<string | Array<string>>) {
    checkPerms(el, binding.value);
  }
};
