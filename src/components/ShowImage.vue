<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { IonImg } from '@ionic/vue';
import { useStorage } from '@/composables/useStorage';
import { ComponentProps } from '@/types';

const { storageSetJson, storageGetJson } = useStorage();
const props = defineProps<ComponentProps>();

interface ShowImage {
  type: string;
  label: boolean;
  field: string;
}

const data = ref<ShowImage>({
  type: 'show-image',
  label: false,
  field: '',
});

onMounted(async () => {
  const stored = await storageGetJson(props.id);
  if (stored) {
    data.value = stored;
  } else {
    data.value.label = props.label === 'true' || props.label === '1';
    if (props.field) data.value.field = props.field;
    await storageSetJson(props.id, data.value);
  }
});

const isComplete = computed(() => {
  // Component is complete if label is true and field has a value
  return data.value.label && data.value.field && data.value.field.trim() !== '';
});

defineExpose({
  isComplete,
});
</script>

<template>
  <div v-if="data.label" class="show-image ion-margin-bottom">
    <ion-img :src="data.field" alt="image" />
  </div>
</template>

<style lang="css" scoped>
div {
  display: block;
  margin: 30px auto;
  text-align: center;
}
ion-img {
  contain: none;
  background: transparent;
}
</style>
