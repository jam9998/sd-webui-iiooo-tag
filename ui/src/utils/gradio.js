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
    el_txt2img_prompt: 'div[id=txt2img_prompt_container] div',
    el_txt2img_prompt_textarea: 'div[id=txt2img_prompt_container] textarea[data-testid=textbox]',
    el_img2img_prompt: 'div[id=img2img_prompt_container] div',
    el_img2img_prompt_textarea: 'div[id=img2img_prompt_container] textarea[data-testid=textbox]'
}

export { el_selector } 