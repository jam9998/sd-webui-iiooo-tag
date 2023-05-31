<template>
<div v-if="preview" class="prompt-preview">
  <div 
    :draggable="true"
    class="prompt-preview-child"
    :style="{backgroundColor: listType === 'Forward' ? positivePromptBackGroundEnum[0] : negativePromptBackGroundEnum[0]}"
    @dragenter="dragenter($event, listType, index)"
    @dragover.prevent
    @dragstart="dragstart(listType, index)"
  >
    <a-popover placement="top">
      <template #content>
        <div class="prompt-preview-popover">
          <div>
            <a-button type="primary" @click="handleUpdateWeight('dec', index)">
              <template #icon><MinusOutlined /></template>
            </a-button>
            <span class="weight">{{ preview.weight }}</span>
            <a-button type="primary"  @click="handleUpdateWeight('up', index)">
              <template #icon><PlusOutlined /></template>
            </a-button>
          </div>
          <div class="text"> 
            {{ 
              combinationPrompt(preview.englishName, preview.weight, preview.type) 
            }} 
          </div>
        </div>
      </template>
      <div class="text">
        {{ 
          combinationPrompt(preview.chineseName, preview.weight, preview.type) 
        }}
      </div>
    </a-popover>
    <div class="close-btn" @click="handleDeletePrompt(index)">
      <CloseCircleOutlined />
    </div>
  </div>
</div>
</template>
<script lang="ts">
export default {
  name: 'DragPreview'
}
</script>
<script setup lang="ts">
import { CloseCircleOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { addFloat, combinationPrompt } from "../../utils/common";
const positivePromptBackGroundEnum = {
  '-5': '#717171',
  '-4': '#969696',
  '-3': '#bcbcbc',
  '-2': '#c9c9c9',
  '-1': '#d7d7d7',
  '0': 'rgb(105, 184, 255)',
  '1': 'rgb(59, 154, 240)',
  '2': 'rgb(12, 140, 255)',
  '3': 'rgb(0, 66, 178)',
  '4': 'rgb(0, 20, 183)',
  '5': 'rgb(0, 10, 123)'
};
const negativePromptBackGroundEnum = {
  '-5': '#717171',
  '-4': '#969696',
  '-3': '#bcbcbc',
  '-2': '#c9c9c9',
  '-1': '#d7d7d7',
  '0': 'rgb(178, 135, 251)',
  '1': '#723ECD',
  '2': 'rgb(119, 58, 224)',
  '3': 'rgb(98, 32, 215)',
  '4': 'rgb(64, 9, 140)',
  '5': 'rgb(40, 3, 94)'
};
type promptType = 'Forward' | 'Negative';
interface promptItemType {
  id: number,
  chineseName: string,
  englishName: string,
  sourceTextType: string,
  weight: number,
  type: '' | 'lora'
}

const props = withDefaults(defineProps<{
  preview?: promptItemType,
  listType: promptType,
  index: number,
  dragIndex: number,
  dragType: promptType,
  list?: Array<promptItemType>
}>(), {
  preview: null,
  listType: 'Forward',
  list: [] as any
});


const emit = defineEmits({
  ['update:dragIndex'](index: number) {
    return true;
  },
  ['update:dragType'](type: promptType) {
    return true;
  },
  ['update:list'](list: Array<promptItemType>) {
    return true;
  }
});

/**
 *  拖拽元素被拖拽操作
 *  @param {promptType} type
 *  @param {number} index
 */
const dragstart = (type: promptType, index: number) => {
  if (index >= 0) {
    emit('update:dragIndex', index);
    emit('update:dragType', type);
  }
};
/**
 *  拖拽元素进入某元素操作
 *  @param {DragEvent} e
 *  @param {promptType} type
 *  @param {number} index
 */
const dragenter = (e: DragEvent, type: promptType, index: number) => {
  e.preventDefault();
  const { list, dragIndex, dragType } = props;
  if (dragType === type && dragIndex >= 0 && dragIndex !== index) {
    const newList = list.slice(0);
    const source = newList[dragIndex];
    newList.splice(dragIndex, 1);
    newList.splice(index, 0, source);
    emit('update:list', newList);
    emit('update:dragIndex', index)
  }
};
/**
 *  删除词条操作
 *  @param {number} index
 */
const handleDeletePrompt = (index: number) => {
   const { list } = props;
   const newList = list.slice(0);
  newList.splice(index, 1);
  emit('update:list', newList);
}
/**
 *  更新给词条权重操作
 *  @param {string} type
 *  @param {number} index
 */
const handleUpdateWeight = (type: 'up' | 'dec', index: number) => {
  const { list } = props;
  const { weight, type: promptType } = list[index];
  switch (type) {
    case 'up':
      if (
        (promptType === 'lora' && weight >= 0 && weight < 1) || 
        (!promptType && weight >= 0 && weight < 1.7)
      ) {
        let w = addFloat(weight, 0.1);
        list[index].weight = w;
        emit('update:list', list);
      }
      break;
    case 'dec':
      if (
        (promptType === 'lora' && weight > 0 && weight <= 1) ||
        (!promptType && weight > 0 && weight <= 1.7)
      ) {
        let w = addFloat(weight, -0.1);
        list[index].weight = w;
        emit('update:list', list);
      }
      break;
    default:
      break;
  }
};
</script>
<style lang="less" scoped>
.prompt-preview {
  border: 1px solid transparent;
  border-radius: 0.375rem;
  overflow: hidden;
}
.prompt-preview-child {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  height: 3.25rem;
  line-height: 2.5rem;
  padding: 0.375rem 0.75rem;
  cursor: move;
  .text {
    font-size: 1rem;
    font-weight: 500;
    color: #fff;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 0.375rem;
  }
  .close-btn {
    font-size: 1rem;
    text-align: center;
    flex-shrink: 0;
    color: #fff;
    cursor: pointer;
  }
}
.prompt-preview-popover {
  display: flex;
  align-items: center;
  .weight,
  .text {
    font-size: 0.875rem;
    font-weight: 500;
    color: #fff;
  }
  .weight {
    padding: 0 0.375rem;
  }
  .text {
    margin-left: 0.65rem;
  }
}
:global(.ant-popover-inner) {
  background-color: #232323;
  border: 1px solid #3d3d3d;
}
:global(.ant-popover-arrow-content) {
  background-color:#3d3d3d;
}
</style>