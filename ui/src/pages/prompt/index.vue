<template>
  <div class="prompt-container">
    <main>
      <div class="prompt-box-wrapper" :key="prompt.key" v-for="(prompt, index) in promptTypeList">
        <a-spin :spinning="prompt.loading">
          <a-textarea
            :value="prompt.word"
            class="prompt-textarea"
            :disabled="prompt.loading"
            :data-type="prompt.key"
            :placeholder="prompt.placeholder" 
            allow-clear 
            show-count
            :bordered="false" 
            :maxlength="promptWordMaxLength"
            :rows="6"
            @change="handleChangeWords($event, index)"
            @keydown.enter.native="(e) => e.preventDefault()"
            @keyup.enter.native="handleTranslateWords($event, index)"
          />
        </a-spin>
        <div class="operate-box">
          <div class="operate-top-inline">
            <div :key="i" v-for="(o, i) in operateList" class="operate-item">
              <div class="label" v-if="o.name === 'switch'">{{ o.title }}</div>
               <template v-if="o.name === 'switch'">
                  <a-switch :checked="prompt.syncCheck" @change="(v) => { prompt.syncCheck = v; }"></a-switch>
               </template>
               <template v-else-if="o.name === 'button'">
                  <a-button 
                    type="primary" 
                    ghost 
                    @click="handleActionClick(o.methods, prompt.key)"
                  >
                    {{ o.title }}
                  </a-button>
               </template>
            </div>
          </div>
          <template v-for="p in promptTypeList">
            <a-spin 
              :key="p.key" 
              v-if="p.key === prompt.key" 
              :spinning="prompt.loading"
            >
              <DragList 
                :key="p.key"
                v-if="p.key === prompt.key"
                :list="getCurrentPromptList(p.key)"
              >
                <template #list-body="scope">
                  <template v-if="p.key === 'Forward'">
                    <DragPreview
                      :key="t.id"
                      v-for="(t, i) in scope.list.value"
                      v-model:dragIndex="currentDragIndex"
                      v-model:dragType="currentDragType"
                      v-model:list="translateForwardList"
                      :listType="p.key"
                      :preview="t"
                      :index="i"
                    />
                  </template>
                  <template v-else-if="p.key === 'Negative'">
                    <DragPreview
                      :key="t.id"
                      v-for="(t, i) in scope.list.value"
                      v-model:dragIndex="currentDragIndex"
                      v-model:dragType="currentDragType"
                      v-model:list="translateNegativeList"
                      :listType="p.key"
                      :preview="t"
                      :index="i"
                    />
                  </template>
                </template>
              </DragList>
            </a-spin>
          </template>
        </div>
      </div>
    </main>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, reactive, Ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { translationPromptRequest } from '../../api/index';
import DragList from '../../components/DragList/index.vue';
import DragPreview from '../../components/DragPreview/index.vue';
import { el_selector } from "../../utils/gradio";
import {
  combinationPrompt,
  countLayers,
  canTranslate, 
  getPromptWeightNum, 
  loraRegex,
  splitTag, 
  splitPrompts
} from "../../utils/common";

type promptType = 'Forward' | 'Negative';
type operateMethods = 'copyByChinese' | 'copyByEnglish' | 'sort';
interface promptItemType {
  key: promptType,
  title: string,
  placeholder: string,
  word: string,
  syncCheck: boolean,
  loading: boolean
}
interface translateType {
  id: number,
  chineseName: string,
  englishName: string,
  sourceTextType: string,
  weight: number,
  type: '' | 'lora'
}
type translateStatusType = Record<promptType, 'first' | 'update'>;

const idByReal: Ref<number> = ref(0);
const currentDragType: Ref<promptType | ''> = ref('');
const currentDragIndex: Ref<Number> = ref(0);
const promptTypeList: Array<promptItemType> = reactive([
  {
    key: 'Forward',
    title: '正向提示词',
    placeholder: '请输入正向提示词',
    word: '',
    syncCheck: true,
    loading: false
  },
  {
    key: 'Negative',
    title: '反向提示词',
    placeholder: '请输入反向提示词',
    word: '',
    syncCheck: true,
    loading: false
  }
]);
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
const translateForwardList: Ref<Array<translateType>> = ref([]);
const translateNegativeList: Ref<Array<translateType>> = ref([]);
const translateStatus: Ref<translateStatusType> = ref({
  Forward: 'first',
  Negative: 'first'
})

const copyForwardPromptByCN = computed(() => 
  translateForwardList.value.map(p => 
    combinationPrompt(p.chineseName, p.weight, p.type)
  ).join(',')
);
const copyForwardPromptByEN = computed(() => 
  translateForwardList.value.map(p => 
    combinationPrompt(p.englishName, p.weight, p.type)
  ).join(',')
);
const copyNegativePromptByCN = computed(() => 
  translateNegativeList.value.map(p => 
    combinationPrompt(p.chineseName, p.weight, p.type)
  ).join(',')
);
const copyNegativePromptByEN = computed(() => 
  translateNegativeList.value.map(p => 
    combinationPrompt(p.englishName, p.weight, p.type)
  ).join(',')
);

watch(
  translateForwardList,
  (count, prevCount) => {
    const { syncCheck } = promptTypeList[0]; 
    if (syncCheck) {
      if (translateStatus.value.Forward === 'update') {
        promptTypeList[0].word = copyForwardPromptByEN.value;
      } else if (translateStatus.value.Forward === 'first') {
        translateStatus.value.Forward = 'update';
      }
    }
  },
  { deep: true }
)
watch(
  translateNegativeList,
  (count, prevCount) => {
    const { syncCheck } = promptTypeList[1]; 
    if (syncCheck) {
      if (translateStatus.value.Negative === 'update') {
        promptTypeList[1].word = copyNegativePromptByEN.value;
      } else if (translateStatus.value.Negative === 'first') {
        translateStatus.value.Negative = 'update';
      }
    }
  },
  { deep: true }
)

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
      const res = (type === 'Forward' ? copyForwardPromptByCN : copyNegativePromptByCN).value;
      if (!res) return;
      copyText(res).then((bool) => {
        if (bool) {
          message.success('复制成功：'+ res);
        } else {
          message.error('复制失败');
        }
      })
      break;
    case 'copyByEnglish':
      const resByEN = (type === 'Forward' ? copyForwardPromptByEN : copyNegativePromptByEN).value;
      if (!resByEN) return;
      copyText(resByEN).then((bool) => {
        if (bool) {
          message.success('复制成功：'+ resByEN);
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
  const list = getCurrentPromptList(type);
  list.value.sort((a, b) => {
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

const getCurrentPromptList = (type: promptType) => {
  return type === 'Forward' ? translateForwardList : translateNegativeList;
};

const handleChangeWords = async(e: any, index: number) => {
  promptTypeList[index].word = e.target.value;
};

/**
 *  翻译词条操作
 *  @param {KeyboardEvent | FocusEvent} e
 *  @param {number} index
 */
const handleTranslateWords = async (e: KeyboardEvent | FocusEvent, index: number) => {
  const { word, key } = promptTypeList[index];
  promptTypeList[index].loading = true;
  // 换行
  if (e instanceof KeyboardEvent && e.shiftKey && e.key === 'Enter') {
    promptTypeList[index].word = word + '\n';
    return;
  }
  e.preventDefault();
  const wordArr = splitPrompts(word);
  if (!wordArr.length) return;
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
    const cur = getCurrentPromptList(key);
    cur.value = newData;
  };
  promptTypeList[index].loading = false;
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
<style scoped lang="less">
.prompt-container {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  background-color: #121212;
  > main {
    width: 100%;
    max-width: 1280px;
    height: 100vh;
    min-height: 100%;
    margin: 0 auto;
    background-color: initial;
    padding: 1rem 0.75rem;
    box-sizing: border-box;
  }
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

  // .prompt-item {
  //   border: 1px solid transparent;
  //   border-radius: 0.375rem;
  //   overflow: hidden;
  // }
  // .prompt-item-child {
  //   position: relative;
  //   display: flex;
  //   align-items: center;
  //   justify-content: space-between;
  //   box-sizing: border-box;
  //   height: 3.25rem;
  //   line-height: 2.5rem;
  //   padding: 0.375rem 0.75rem;
  //   cursor: move;
  //   .text {
  //     font-size: 1rem;
  //     font-weight: 500;
  //     color: #fff;
  //     width: 100%;
  //     white-space: nowrap;
  //     overflow: hidden;
  //     text-overflow: ellipsis;
  //     margin-right: 0.375rem;
  //   }
  //   .close-btn {
  //     font-size: 1rem;
  //     text-align: center;
  //     flex-shrink: 0;
  //     color: #fff;
  //   }
  // }
}
// .prompt-item-popover {
//   display: flex;
//   align-items: center;
//   .weight,
//   .text {
//     font-size: 0.875rem;
//     font-weight: 500;
//     color: #fff;
//   }
//   .weight {
//     padding: 0 0.375rem;
//   }
//   .text {
//     margin-left: 0.65rem;
//   }
// }
// :global(.ant-popover-inner) {
//   background-color: #232323;
//   border: 1px solid #3d3d3d;
// }
// :global(.ant-popover-arrow-content) {
//   background-color:#3d3d3d;
// }
</style>
