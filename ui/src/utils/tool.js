export function sleep(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time)
    })
}
export async function querySelector() {
    let args = [...arguments]
    // console.log("querySelector", args)
    try {
        let dom = document.querySelector.apply(document, args)
        if (dom) {
            return dom
        }
    } catch (error) {

    }
    await sleep(60)
    return querySelector.apply(null, args)
}
export async function querySelectorAll() {
    let args = [...arguments]
    // console.log("querySelectorAll", args)
    try {
        let doms = document.querySelectorAll.apply(document, args)
        if (doms.length) {
            return doms
        }
    } catch (error) {

    }
    await sleep(60)
    return querySelectorAll.apply(null, args)
}

export function insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}