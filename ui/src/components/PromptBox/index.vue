<template>
  <div class="prompt-box-wrapper">
    <!-- <a-spin :spinning="loading">
      <a-textarea
        class="prompt-textarea"
        :disabled="loading"
        :data-type="type"
        allow-clear 
        show-count
        :bordered="false" 
        :maxlength="promptWordMaxLength"
        :rows="6"
      />
    </a-spin> -->
    <div class="operate-box">
      <div class="operate-top-inline">
        <a-tooltip>
          <template #title>
            回车自动翻译，支持中英文混编，支持本地化保存提交记录
          </template>
          <div style="color:#fff;font-size:16px">
            <QuestionCircleOutlined style="cursor:pointer" />
          </div>
        </a-tooltip>
        <div :key="i" v-for="(o, i) in operateList" class="operate-item">
          <div class="label" v-if="o.name === 'switch'">{{ o.title }}</div>
            <template v-if="o.name === 'switch'">
              <a-switch :checked="syncCheck" @change="handleSyncCheckChange"></a-switch>
            </template>
            <template v-else-if="o.name === 'button'">
              <a-button
                type="primary"
                class="prompt-primary-btn"
                @click="handleActionClick(o.methods)"
              >
                <component :is="o.icon"></component>
                {{ o.title }}
              </a-button>
            </template>
            <template v-else-if="o.name === 'select'">
              <a-select
                v-if="promptCateGory === 'Forward'"
                allowClear
                class="prompt-select"
                dropdownClassName="prompt-dropdown"
                style="width:150px"
                :placeholder="o.placeholder"
                :value="o.value"
                @change="(v) => handleActionClick(o.methods, v)"
              >
                <a-select-option 
                  :key="opt.id" 
                  v-for="opt in o.options"
                  :value="o.id"
                  style="color: #fff"
                >
                  {{ opt.name }}
                </a-select-option>
              </a-select>
            </template>
        </div>
        <a-select
          v-if="promptCateGory === 'Forward'"
          allowClear
          class="prompt-select"
          dropdownClassName="prompt-dropdown"
          style="width:180px;margin-left:auto"
          placeholder="历史记录"
          @change="(v) => handleSubmitRecordChange(v)"
        >
          <a-select-option 
            :key="item.id" 
            v-for="(item, index) in submitList"
            :value="item.id"
            style="color: #fff"
          >
            第{{ index + 1 }}条记录—{{ item.id.split(':')[1] }}
          </a-select-option>
        </a-select>
      </div>
      <a-spin :spinning="loading">
        <DragList :list="translateList">
          <template #list-body="scope">
            <DragPreview
              :key="t.id"
              v-for="(t, i) in scope.list"
              v-model:dragIndex="currentDragIndex"
              v-model:dragType="currentDragType"
              v-model:list="translateList"
              :listType="promptCateGory"
              :preview="t"
              :index="i"
            />
          </template>
        </DragList>
      </a-spin>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'PromptBox'
}
</script>
<script setup lang="ts">
import { computed, onMounted, ref, Ref, reactive, watch, getCurrentInstance } from 'vue';
import { message } from 'ant-design-vue';
import { 
  CopyOutlined, 
  QuestionCircleOutlined,
  RetweetOutlined
} from '@ant-design/icons-vue';
import { 
  tagManageKeyWordList,
  translationPromptRequest 
} from '../../api/index';
import {
  combinationPrompt,
  countLayers,
  canTranslate, 
  getPromptWeightNum, 
  loraRegex,
  splitTag, 
  splitPrompts
} from "../../utils/common";
import { el_selector } from "../../utils/gradio";

type promptType = 'Forward' | 'Negative';
type operateMethods = 'copyByChinese' | 'copyByEnglish' | 'sort' | 'selectkeyword';
type StatusType = 'first' | 'update';
interface translateType {
  id: number,
  chineseName: string,
  englishName: string,
  sourceTextType: string,
  weight: number,
  type: '' | 'lora'
}
interface submitType {
  id: number,
  Forward?: Array<translateType>,
  Negative?: Array<translateType>
}
const operateList = reactive([
  {
    name: 'switch',
    title: '同步翻译',
    forwardValue: true,
    negativeValue: true
  },
  {
    name: 'button',
    icon: CopyOutlined,
    title: '中文',
    methods: 'copyByChinese'
  },
  {
    name: 'button',
    icon: CopyOutlined,
    title: '英文',
    methods: 'copyByEnglish'
  },
  {
    name: 'button',
    icon: RetweetOutlined,
    methods: 'sort'
  },
  {
    name: 'select',
    title: '质量词模板',
    methods: 'selectkeyword',
    placeholder: '质量词模板',
    options: [],
    value: undefined
  }
])
const promptWordMaxLength = ref(300);
const idByReal: Ref<number> = ref(0);
const syncCheck: Ref<boolean> = ref(true);
const translateList: Ref<Array<translateType>> = ref([]);
const currentDragType: Ref<promptType | ''> = ref('');
const currentDragIndex: Ref<Number> = ref(0);
const promptCateGory: Ref<promptType> = ref('Negative');
const loading = ref(false);
const submitList: Ref<Array<submitType>> = ref(localStorage.getItem('iiooo_submit_record') ? JSON.parse(localStorage.getItem('iiooo_submit_record')) :[]);
const copyPromptByCN = computed(() => 
  translateList.value.map(p => 
    combinationPrompt(p.chineseName, p.weight, p.type)
  ).join(',')
);
const copyPromptByEN = computed(() => 
  translateList.value.map(p => 
    combinationPrompt(p.englishName, p.weight, p.type)
  ).join(',')
);

let Textarea;
let NegativeTextarea;
onMounted(() => {
  if (promptCateGory.value === 'Forward') {
    reqTagManageKeyWordList();
  }
});

watch(
  promptCateGory,
  (cur, pre) => {
    if (pre === 'Negative' && cur === 'Forward') {
      reqTagManageKeyWordList();
    }
  }
)
watch(
  translateList,
  (count, prevCount) => {
    if (syncCheck.value) {
      Textarea && (Textarea.value = copyPromptByEN.value);
    }
  },
  { deep: true }
)
const updateTranslateList = (v: Array<translateType>) => {
  translateList.value = v;
}
/**
 *  供其他组件获取当前组件翻译列表的值 hook
 */
const useTranslateList = () => {
  return {
    translateList,
    setTranslateList: updateTranslateList
  }
}
/**
 * 原生dom初始化
 */
const initDom = (selector: any, negativeSelector: any) => {
  if (selector && negativeSelector) {
    promptCateGory.value = 'Forward';
  }
  Textarea = selector;
  negativeSelector && (NegativeTextarea = negativeSelector);
  Textarea.value = '';
  Textarea.oninput = (e: any) => {}
  Textarea.onkeydown = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
    }
  }
  Textarea.onkeyup = async (e: any) => {
    if (e.key === 'Enter') {
      await handleTranslateWords(e);
    } else if (e === '__custom') {
      await handleTranslateWords(null);
    }
  }
  Textarea.$useTranslateList = useTranslateList;
};

const getCurrentMonthAndDay = () => {
  const date = new Date();
  let month = date.getMonth()  + 1; //得到月份
  let day = date.getDate(); //得到日期
  return month + '月' + day + '日';
}

const saveSubmitRecord = (async = false) => {
  if (Textarea) {
    const size = getLocalStorageSize();
    if (typeof size === 'number') {
      if (size > 1024 * 1024 * 5) {
        localStorage.removeItem('iiooo_submit_record');
      }
      let preData = localStorage.getItem('iiooo_submit_record')
      const pre = preData ? JSON.parse(preData) : [];
      const res = {
        id: pre.length + ':' + getCurrentMonthAndDay(),
        [promptCateGory.value]: translateList.value.slice(0)
      };
      if (async && NegativeTextarea) {
        const { translateList: otherT } = NegativeTextarea.$useTranslateList();
        const type = promptCateGory.value === 'Forward' ? 'Negative' : 'Forward';
        res[type] = otherT.value.slice(0);
      }
      pre.unshift(res);
      submitList.value = pre;
      localStorage.setItem('iiooo_submit_record', JSON.stringify(pre));
    }
  }
}

const getLocalStorageSize = () => {
  let storage: any = ''
  if (!window.localStorage) {
    console.info('浏览器不支持localStorage');
  } else {
    storage = window.localStorage;
  }
  if (storage !== '') {
    var size = 0;
    for (var item in storage) {
      if (Object.prototype.hasOwnProperty.call(storage, item)) {
        size += storage.getItem(item).length;
      }
    }
    return size;
  }
  return undefined;
}

const handleSubmitRecordChange = (v: number) => {
  const index = submitList.value.findIndex(s => s.id === v);
  if (index >= 0) {
    const newForwardValue = submitList.value[index].Forward || [];
    const newNegativeValue = submitList.value[index].Negative || [];
    translateList.value = promptCateGory.value === 'Forward' ? newForwardValue : newNegativeValue;
    if (NegativeTextarea) {
      const { setTranslateList } = NegativeTextarea.$useTranslateList();
      setTranslateList(promptCateGory.value === 'Forward' ? newNegativeValue : newForwardValue);
    }
  }
}

const handleSyncCheckChange = (v: boolean) => {
  syncCheck.value = v;
};

/**
 *  复制函数
 *  @param {string} text
 *  @returns {promise}
 */
const copyText = (text: string) => {
  return navigator.clipboard
    .writeText(text)
    .then(() => {
      return true;
    })
    .catch(() => {
      return false;
    });
};

const handleActionClick = (methods: operateMethods, value: any) => {
  switch (methods) {
    case 'copyByChinese':
      if (!copyPromptByCN.value) return;
      copyText(copyPromptByCN.value).then((bool) => {
        if (bool) {
          message.success('复制成功：'+ copyPromptByCN.value);
        } else {
          message.error('复制失败');
        }
      })
      break;
    case 'copyByEnglish':
      if (!copyPromptByEN.value) return;
      copyText(copyPromptByEN.value).then((bool) => {
        if (bool) {
          message.success('复制成功：'+ copyPromptByEN.value);
        } else {
          message.error('复制失败');
        }
      })
      break;
    case 'sort':
      handleSortPromptList();
      break;
    case 'selectkeyword':
      handleChangeKeywords(value);
      break
    default:
      break;
  }
};

const handleChangeKeywords = async(value: any) => {
  const index = operateList.findIndex(o => o.title === '质量词模板');
  if (index >= 0) {
    if (value === operateList[index].value) return;
    const preValue = operateList[index].value;
    operateList[index].value = value;
    const keyWord = (operateList[index].options as Array<any>).filter(opt => opt.id === value)[0];
    // 找到之前质量词用于替换
    if (preValue && preValue !== '质量词' && Textarea && NegativeTextarea) {
      const preKeyWord = (operateList[index].options as Array<any>).filter(opt => opt.id === preValue)[0];
      const n = preKeyWord.negCueWord;
      const p = preKeyWord.posCueWord;
      const nIndex = NegativeTextarea.value.lastIndexOf(n);
      const pIndex = Textarea.value.lastIndexOf(p);
      if (nIndex >=0 && pIndex >= 0) {
        NegativeTextarea.value = NegativeTextarea.value.slice(0, nIndex) + NegativeTextarea.value.slice(nIndex + n.length);
        Textarea.value = Textarea.value.slice(0, pIndex) + Textarea.value.slice(pIndex + p.length);
      }
    }
    if (keyWord) {
      const negCueWord = keyWord.negCueWord || '';
      const posCueWord = keyWord.posCueWord || '';
      if (Textarea) {
        const length = Textarea.value.length;
        const value = Textarea.value;
        Textarea.value = value + ((value[length - 1] === ',' || value[length - 1] === '，' || !value) ? '' : ',') + posCueWord;
      }
      if (NegativeTextarea) {
        const length = NegativeTextarea.value.length;
        const value = NegativeTextarea.value;
        NegativeTextarea.value = value + ((value[length - 1] === ',' || value[length - 1] === '，' || !value) ? '' : ',') + negCueWord;
      }
      if (Textarea && NegativeTextarea) {
        let cur;
        let oth;
        posCueWord && (cur = Textarea.onkeyup('__custom'));
        negCueWord && (oth = NegativeTextarea.onkeyup('__custom'));
        await cur;
        await oth;
        saveSubmitRecord(true);
      }
    }
  }
};

/**
 *  提示词列表排序操作
 */
const handleSortPromptList = () => {
  translateList.value.sort((a, b) => {
    if (a.type === 'lora' && b.type === 'lora') {
      return Math.abs(b.weight) - Math.abs(a.weight);
    } else if (a.type === 'lora' && b.type !== 'lora') {
      return -1;
    } else if (a.type !== 'lora' && b.type === 'lora') {
      return 1;
    }
    if (b.weight === a.weight) {
      return b.chineseName > a.chineseName ? 1 : a.chineseName > b.chineseName ? -1 : 0;
    }
    return b.weight - a.weight;
  });
}

/**
 *  翻译词条操作
 *  @param {KeyboardEvent | null } e
 */
const handleTranslateWords = async (e: KeyboardEvent | null) => {
  const inputValue = (e && e.target.value) || Textarea.value;
  if (!inputValue) return;
  // 换行
  if (e && e.shiftKey && e.key === 'Enter') {
    return;
  }
  e && e.preventDefault();
  const wordArr = splitPrompts(inputValue);
  if (!wordArr.length) return;
  loading.value = true;
  const translateWords = [];
  const cacheWords = wordArr.map((word, index) => {
    let type = loraRegex.test(word) ? 'lora' : '';
    const { value, left, right } = splitTag(word.trim());
    let isCanTranslate = canTranslate(word);
    const wordName = value;
    if (isCanTranslate) {
      translateWords.push('(' + wordName + ')');
    }
    let weight = getPromptWeightNum(word);
    let layer = 0;
    if (!weight) {
      if (left && left[0] === '(' && right && right[right.length - 1] === ')') {
        layer = countLayers(left + right, '(', ')');
      } else if (left && left[0] === '[' && right && right[right.length - 1] === ']') {
        layer = countLayers(left + right, '(', ')');
      }
    }
    layer && (weight = Number(String(Math.pow(1.1, layer)).replace(/^(.*\..{1}).*$/, '$1')));
    return {
      name: wordName,
      weight,
      index,
      isCanTranslate,
      type
    }
  });
  const res = await reqTranslate(translateWords.join(','));
  if (res && res.code === 0) {
    const newData = res.data;
    cacheWords.map(({name, weight, index, isCanTranslate, type}) => {
      // 不能翻译的词条插入接口返回队列中
      if (!isCanTranslate) {
        newData.splice(index, 0, {
          chineseName: name,
          englishName: name,
          id: idByReal.value++,
          sourceTextType: "en",
          type,
          weight,
        });
        return;
      }
      newData[index].type =  type;
      newData[index].weight =  weight;
    });
    translateList.value = newData;
    if (e) {
      saveSubmitRecord();
    }
  };
  loading.value = false;
};

/**
 *  请求翻译
 *  @param {string} words
 *  @returns {object}
 */
const reqTranslate = async (words: string) => {
  if (!words.length) return;
  try {
    const res: any = await translationPromptRequest({
      text: words
    });
    return res;
  } catch (error) {
    console.log(error);
    return { msg: error };
  }
};
/**
 *  获取词条质量词
 */
const reqTagManageKeyWordList =async () => {
  try {
    const res: any = await tagManageKeyWordList();
    if (res.code === 0) {
      const index = operateList.findIndex(o => o.methods === 'selectkeyword');
      if (index >= 0) {
        operateList[index].options = [
          // {
          //   name: '请选择质量词',
          //   id: '质量词'
          // },
          ...res.data
        ];
        // operateList[index].value = '质量词';
      }
    }
  } catch (error) {
    console.log(error);
  }
}

defineExpose({
  initDom
})
</script>
<style lang="less" scoped>
.prompt-box-wrapper {
  margin-top: 0.75rem;
}
.prompt-textarea {
  background-color: #232323;
  margin-bottom: 1.875rem;
  :deep(.ant-input) {
    color: #fff;
    height: 142px !important;
    max-height: 142px !important;
  }
  &::after {
    color: #fff;
  }
}
.prompt-primary-btn {
  color: #9ec5ff;
  background-color: #000;
  border: 1px solid transparent;
  padding: 0.25rem 0.9375rem;
  &:hover,
  &:focus {
    background-color: #384f71;
    border: 1px solid transparent;
  }
  &:focus {
    color: #1890ff;
  }
}
:global(.prompt-dropdown) {
  background-color: #232323;
}
:global(.ant-select-item-option-active:not(.ant-select-item-option-disabled)) {
  background-color: #1890ff;
}
:global(.ant-select-item-option-selected:not(.ant-select-item-option-disabled)) {
  background-color: #91d5ff;
}
:global(.ant-select-item-empty > .ant-empty-normal) {
  color: #fff;
}
.prompt-select {
  :deep(.ant-select-selector) {
    background-color: #232323;
    color: #fff;
    border-color: transparent;
    &:hover {
      border-color: #3d3d3d;
    }
  }
  :deep(.ant-select-arrow) {
    color: #fff;
  }
  :deep(.ant-select-clear) {
    background-color: #232323;
  }
  :deep(.anticon-close-circle) {
    background-color: #232323;
    color: #fff;
  }
  &.ant-select-focused:not(.ant-select-disabled) {
    :deep(.ant-select-selector) {
      border-color: #3d3d3d;
    }
  }
}
.operate-box {
  border: 1px solid #3d3d3d;
}
.operate-top-inline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 0.75rem;
  border-bottom: 1px solid #3d3d3d;
  > div {
    display: flex;
    align-items: center;
    margin-bottom: 0.375rem;
  }
  > div + div {
    margin-left: 0.75rem;
  }
  .label {
    font-size: 1rem;
    font-weight: 500;
    color: #fff;
    margin-right: 0.5rem;
  }
  :deep(.ant-switch) {
    background-color: #3d3d3d;
  }
  :deep(.ant-switch-checked) {
    background-color: #1890ff;
  }
}
</style>