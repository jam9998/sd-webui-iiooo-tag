<template>
  <div class="prompt-box-wrapper">
    <a-spin :spinning="loading">
      <a-textarea
        class="prompt-textarea"
        :disabled="loading"
        :data-type="type"
        :placeholder="placeholder" 
        allow-clear 
        show-count
        :bordered="false" 
        :maxlength="promptWordMaxLength"
        :rows="6"
      />
    </a-spin>
    <div class="operate-box">
      <div class="operate-top-inline">
        <div :key="i" v-for="(o, i) in operateList" class="operate-item">
          <div class="label" v-if="o.name === 'switch'">{{ o.title }}</div>
            <template v-if="o.name === 'switch'">
              <a-switch :checked="syncCheck" @change="(v) => { syncCheck.value = v; }"></a-switch>
            </template>
            <template v-else-if="o.name === 'button'">
              <a-button 
                type="primary" 
                ghost 
                @click="handleActionClick(o.methods, type)"
              >
                {{ o.title }}
              </a-button>
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
import { computed, onMounted, ref, Ref, reactive, watch } from 'vue';
import { message } from 'ant-design-vue';
import { translationPromptRequest } from '../../api/index';
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
type operateMethods = 'copyByChinese' | 'copyByEnglish' | 'sort';
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
  word: string,
  placeholder: string,
  loading: boolean,
  type: promptType
}>(), {
  word: '',
  placeholder: '',
  loading: false,
  type: 'Forward'
});
const emit = defineEmits({
  ['update:word']: (text: string) => true,
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
    methods: 'selectTemplate',
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
const translateStatus: Ref<StatusType> = ref('first')

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
const TYPE = props.type.replace(props.type[0], props.type[0].toLowerCase());

onMounted(() => {
  let Textarea =document.querySelector(el_selector['el_prompt_textarea_'+TYPE]);
  Textarea.value = props.word;
  Textarea.oninput = (e: any) => {
    emit('update:word', e.target.value)
  }
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
});

watch(
  translateList,
  (count, prevCount) => {
    if (syncCheck.value) {
      if (translateStatus.value === 'update') {
        emit('update:word', copyPromptByEN.value);
      } else if (translateStatus.value === 'first') {
        translateStatus.value = 'update';
      }
    }
  },
  { deep: true }
)

const handleChangeWords = async(e: any) => {
  emit('update:word', e.target.value)
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

const handleActionClick = (methods: operateMethods, type: promptType) => {
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
      handleSortPromptList(type)
      break;
    default:
      break;
  }
};

/**
 *  提示词列表排序操作
 *  @param {promptType} type
 */
const handleSortPromptList = (type: promptType) => {
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
 *  @param {KeyboardEvent | FocusEvent} e
 */
const handleTranslateWords = async (e: KeyboardEvent | FocusEvent) => {
  if (!props.word) return;
  // 换行
  if (e instanceof KeyboardEvent && e.shiftKey && e.key === 'Enter') {
    const newWord = props.word + '\n';
    emit('update:word', newWord)
    return;
  }
  e.preventDefault();
  const wordArr = splitPrompts(props.word);
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