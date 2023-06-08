export function gradioApp() {
  const elems = document.getElementsByTagName('gradio-app')
  const elem = elems.length == 0 ? document : elems[0]

  if (elem !== document) elem.getElementById = function (id) { return document.getElementById(id) }
  return elem.shadowRoot ? elem.shadowRoot : elem
}

export function get_uiCurrentTab() {
  return gradioApp().querySelector('#tabs button:not(.border-transparent)')
}

export function get_uiCurrentTabContent() {
  return gradioApp().querySelector('.tabitem[id^=tab_]:not([style*="display: none"])')
}
let el_selector = {
  // 正向提示词文本域
  el_prompt_textarea_forward: ".prompt-textarea textarea[data-type=Forward]",
  // 反向提示词文本域
  el_prompt_textarea_negative: ".prompt-textarea textarea[data-type=Negative]",

  el_txt2img_prompt: "div[id=txt2img_prompt_container] > div[id^=component]",
  el_txt2img_prompt_textarea: "div[id=txt2img_prompt] textarea[data-testid=textbox]",
  el_txt2img_neg_prompt_textarea: "div[id=txt2img_neg_prompt] textarea[data-testid=textbox]",
  
  el_img2img_prompt: "div[id=img2img_prompt_container] > div[id^=component]",
  el_img2img_prompt_textarea: "div[id=img2img_prompt] textarea[data-testid=textbox]",
  el_img2img_neg_prompt_textarea: "div[id=img2img_neg_prompt] textarea[data-testid=textbox]",
};

export { el_selector } 