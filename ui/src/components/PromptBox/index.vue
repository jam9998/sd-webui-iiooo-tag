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
        <div :key="i" v-for="(o, i) in operateList" class="operate-item">
          <div class="label" v-if="o.name === 'switch'">{{ o.title }}</div>
            <template v-if="o.name === 'switch'">
              <a-switch :checked="syncCheck" @change="handleSyncCheckChange"></a-switch>
            </template>
            <template v-else-if="o.name === 'button'">
              <a-button 
                type="primary" 
                ghost 
                @click="handleActionClick(o.methods)"
              >
                {{ o.title }}
              </a-button>
            </template>
            <template v-else-if="o.name === 'select'">
              <a-select
                v-if="promptCateGory === 'Forward'"
                class="prompt-select"
                dropdownClassName="prompt-dropdown"
                style="width:150px"
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
              :listType="type"
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

const props = withDefaults(defineProps<{
  loading: boolean
}>(), {
  loading: false
});
const emit = defineEmits({
  ['update:loading']: (load: boolean) => true
})
const operateList = reactive([
  {
    name: 'switch',
    title: '同步',
    forwardValue: true,
    negativeValue: true
  },
  {
    name: 'button',
    title: '复制中文',
    methods: 'copyByChinese'
  },
  {
    name: 'button',
    title: '复制英文',
    methods: 'copyByEnglish'
  },
  {
    name: 'button',
    title: '排序',
    methods: 'sort'
  },
  {
    name: 'select',
    title: '质量强化模板',
    methods: 'selectkeyword',
    options: [],
    value: ''
  }
])
const promptWordMaxLength = ref(300);
const idByReal: Ref<number> = ref(0);
const syncCheck: Ref<boolean> = ref(true);
const translateList: Ref<Array<translateType>> = ref([]);
const currentDragType: Ref<promptType | ''> = ref('');
const currentDragIndex: Ref<Number> = ref(0);
const translateStatus: Ref<StatusType> = ref('first');
const promptCateGory: Ref<promptType> = ref('Negative');

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
      if (translateStatus.value === 'update') {
        Textarea && (Textarea.value = copyPromptByEN.value);
      } else if (translateStatus.value === 'first') {
        translateStatus.value = 'update';
      }
    }
  },
  { deep: true }
)

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
  Textarea.onkeyup = (e: any) => {
    if (e.key === 'Enter') {
      handleTranslateWords(e);
    }
  }
};

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

const handleChangeKeywords = (value: any) => {
  const index = operateList.findIndex(o => o.title === '质量强化模板');
  if (index >= 0) {
    if (value === operateList[index].value) return;
    const preValue = operateList[index].value;
    operateList[index].value = value;
    const keyWord = (operateList[index].options as Array<any>).filter(opt => opt.id === value)[0];
    // 找到之前质量词用于替换
    if (preValue && Textarea && NegativeTextarea) {
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
      const negCueWord = keyWord.negCueWord;
      const posCueWord = keyWord.posCueWord;
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
  emit('update:loading', true);
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
  emit('update:loading', true);
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
  };
  emit('update:loading', false);
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
        operateList[index].options = res.data;
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
:global(.prompt-dropdown) {
  background-color: #232323;
}
:global(.ant-select-item-option-active:not(.ant-select-item-option-disabled)) {
  background-color: #1890ff;
}
:global(.ant-select-item-option-selected:not(.ant-select-item-option-disabled)) {
  background-color: #91d5ff;
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