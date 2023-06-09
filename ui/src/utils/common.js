export const loraRegex = /^\<lora:\s*([^\:]+)\s*(:)?\s*([0-9\.]+)?\>$/;
export const lycoRegex = /^\<lyco:\s*([^\:]+)\s*(:)?\s*([0-9\.]+)?\>$/;
export const weightNumRegex = /(.*):([0-9\.]+)/;
export const weightNumRegexEN = /(.*):\s*([0-9\.]+)/;
export const weightNumRegexCN = /(.*)：\s*([0-9\.]+)/;
export const bracketsEN = [
  { '(': '(', ')': ')' },
  { '[': '[', ']': ']' },
  { '{': '{', '}': '}' },
  { '<': '<', '>': '>' },
];
export const bracketsCN = [
  { '（': '(', '）': ')' },
  { '【': '[', '】': ']' },
  { '《': '<', '》': '>' },
  { '「': '{', '」': '}' },
  { '『': '{', '』': '}' },
  { '〈': '<', '〉': '>' },
  { '﹝': '(', '﹞': ')' },
  { '﹛': '{', '﹜': '}' },
  { '﹙': '(', '﹚': ')' },
];

/**
 * 替换标签
 * @param text {string}
 * @returns {*|string}
 */
export const replaceTag = (text) => {
  if (typeof text !== "string") return text
  if (text === "") return text
  text = replaceBrackets(text)
  if (weightNumRegexEN.test(text)) text = text.replace(weightNumRegexEN, '$1:$2')
  if (weightNumRegexCN.test(text)) text = text.replace(weightNumRegexCN, '$1:$2')
  return text
};

/**
 * 替换括号
 * @param text
 * @returns {*}
 */
export const replaceBrackets = (text) => {
  const length = text.length
  if (length === 0) return text
  let replaces = {}
  bracketsCN.forEach(item => {
    for (const key in item) {
      replaces[key] = item[key]
    }
  })

  let start = text[0]
  let end = text[length - 1]
  if (typeof replaces[start] !== "undefined") {
    text = replaces[start] + text.substring(1)
  }
  if (typeof replaces[end] !== "undefined") {
    text = text.substring(0, length - 1) + replaces[end]
  }
  return text
};

/**
 * 是否有括号
 * @param text {string}
 * @returns {Array|boolean}
 */
export const hasBrackets = (text) => {
  const length = text.length
  if (length === 0) return false
  let brackets = []
  bracketsEN.forEach(item => {
    let temp = []
    for (const key in item) {
      temp.push(key)
    }
    brackets.push(temp)
  })
  bracketsCN.forEach(item => {
    let temp = []
    for (const key in item) {
      temp.push(key)
    }
    brackets.push(temp)
  })

  let start = text[0]
  let end = text[length - 1]
  for (const bracket of brackets) {
    if (bracket[0] === start && bracket[1] === end) {
      return bracket
    }
  }
  return false
};

/**
 * 拆分标签
 * @param tag {string}
 * @returns {{left: string, right: string, value: string}}
 */
export const splitTag = (tag) => {
  let result = { left: '', value: '', right: '' }
  let match = tag.match(/^([\(\<\{\[]+)(.*)$/)
  if (!match) {
    // 没有匹配到左括号
    result.value = tag
    return result
  }
  result.left = match[1]
  tag = match[2]
  match = tag.match(/((\:[0-9\.]+)?[\)\>\}\]]+)$/)
  if (!match) {
    // 没有匹配到右括号
    result.value = tag
    return result
  }
  result.right = match[1]
  tag = tag.substring(0, tag.length - result.right.length)
  result.value = tag
  return result
};

/**
 * 分割标签
 * @param tags {string}
 * @returns {string[]}
 */
export const splitTags = (tags) => {
  if (tags === null || tags === undefined || tags === false || tags === "" || tags.trim() === "") return []

  tags = tags.replace(/，/g, ',') // 中文逗号
  tags = tags.replace(/。/g, ',') // 中文句号
  tags = tags.replace(/、/g, ',') // 中文顿号
  tags = tags.replace(/；/g, ',') // 中文分号
  tags = tags.replace(/．/g, ',') // 日文句号

  tags = tags.replace(/\t/g, '\n') // 制表符
  tags = tags.replace(/\r/g, '\n') // 回车符
  tags = tags.replace(/\n+/g, '\n') // 连续换行符

  const brackets = {
      '(': ')',
      '[': ']',
      '<': '>',
      '{': '}'
  }
  const bracketStarts = Object.keys(brackets)

  let length = tags.length
  let temp = ''
  let startBracketChar = ''
  let endBracketChar = ''
  let bracketCount = 0
  let result = []
  for (let i = 0; i < length; i++) {
      const char = tags[i]
      if (char === "\n") {
          if (startBracketChar === '') {
              // 前面没有括号
              if (temp.trim() !== "") {
                  result.push(temp.trim())
              }
              result.push("\n")
              bracketCount = 0
              startBracketChar = ''
              endBracketChar = ''
              temp = ''
          } else {
              // 前面有括号
              temp += ' '
          }
      } else if (char === ",") {
          if (startBracketChar === '') {
              // 前面没有括号
              result.push(temp.trim())
              bracketCount = 0
              startBracketChar = ''
              endBracketChar = ''
              temp = ''
          } else {
              // 前面有括号
              temp += char
          }
      } else {
          if (startBracketChar === '') {
              // 前面没有括号
              if (bracketStarts.includes(char)) {
                  // 括号开始
                  bracketCount = 1
                  startBracketChar = char
                  endBracketChar = brackets[char]
                  temp += char
              } else {
                  temp += char
              }
          } else {
              // 前面有括号
              if (char === endBracketChar) {
                  // 是结束括号的标识，减掉括号计数
                  bracketCount--
                  if (bracketCount === 0) {
                      // 括号计数为0，括号结束
                      startBracketChar = ''
                      endBracketChar = ''
                      temp += char
                  } else {
                      temp += char
                  }
              } else if (char === startBracketChar) {
                  // 是开始括号的标识，加上括号计数
                  bracketCount++
                  temp += char
              } else {
                  temp += char
              }
          }
      }
  }
  if (temp !== '') {
      result.push(temp.trim())
  }
  return result
};

/**
 * 分割标签-正则
 * @param tags {string}
 * @returns {string[]}
 */
export const splitPrompts = (prompts) => {
  if (
    prompts === null ||
    prompts === undefined ||
    prompts === false ||
    prompts === "" ||
    prompts.trim() === ""
  )
    return [];

  prompts = prompts.replace(/，/g, ","); // 中文逗号
  prompts = prompts.replace(/。/g, ","); // 中文句号
  prompts = prompts.replace(/、/g, ","); // 中文顿号
  prompts = prompts.replace(/；/g, ","); // 中文分号
  prompts = prompts.replace(/．/g, ","); // 日文句号

  prompts = prompts.replace(/\t/g, "\n"); // 制表符
  prompts = prompts.replace(/\r/g, "\n"); // 回车符
  prompts = prompts.replace(/\n+/g, "\n"); // 连续换行符
  return prompts.split(/,(?![^(^[]*?(\)|\]))/).filter(p => !!p);
}

/**
 * 是否可以翻译
 * @param text {string}
 * @returns {boolean}
 */
export const canTranslate = (text) => {
    // 如果为空，不翻译
    if (text.trim() === '') return false
    // 如果<>包裹，不翻译
    if (text[0] === '<' && text[text.length - 1] === '>') return false
    // 如果是数字、标点符号，不翻译
    const regex = /^[0-9`~!@#$%^&*()_+\-=\[\]{}\\|;:'",.\/<>?]+$/
    if (regex.test(text)) return false
    // 如果是单个英文字母，不翻译
    if (/^[a-zA-Z]$/.test(text)) return false
    return true
};

/**
 * 获取标签的权重数
 * @param prompt {string}
 * @returns {number}
 */
export const getPromptWeightNum = (prompt) => {
  const match = prompt.match(weightNumRegex);
  let weightNum = match ? parseFloat(match[2]) : 1;
  weightNum = weightNum > 0 ? weightNum : 1;
  return weightNum;
};

/**
 * 计算字符串包裹的层数
 * @param str {string}
 * @param start {string}
 * @param end {string}
 * @returns {number}
 */
export const countLayers = (str, start = '(', end = ')') => {
    let count = 0
    if (str.length < 2) return count // 长度小于2，不可能有会有包裹
    while (true) {
        // 取出第一个和最后一个字符
        let first = str[0]
        let last = str[str.length - 1]
        if (first === start && last === end) {
            // 如果第一个和最后一个字符是括号，且是对应的括号，那么层数加1，然后去掉第一个和最后一个字符
            count++
            // 去掉第一个和最后一个字符
            str = str.slice(1, str.length - 1)
        } else {
            break
        }
    }
    return count
};

export const combinationPrompt = (str, weight, type = '') => {
  let res = str;
  if (!type && typeof weight === 'number' && weight !== 1) {
    res = "(" + str + ":" + weight + ")";
  } else if (type === "lora") {
    res = "<" + str + ":" + weight + ">";
  };
  return res;
};

export const addFloat = (arg1, arg2) => {
  let r1, r2, m;
  try {
    r1 = arg1.toString().split('.')[1].length;
  } catch (e) {
    r1 = 0;
  }
  try {
    r2 = arg2.toString().split('.')[1].length;
  } catch (e) {
    r2 = 0;
  }
  m = Math.pow(10, Math.max(r1, r2));
  return (parseInt(arg1 * m) + parseInt(arg2 * m)) / m;
};