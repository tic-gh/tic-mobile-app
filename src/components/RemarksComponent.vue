<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { IonLabel, IonTextarea } from '@ionic/vue';
import { useDebounce } from '@/composables/useDebounce';
import { useStorage } from '@/composables/useStorage';
import { ComponentProps } from '@/types';

const props = defineProps<ComponentProps>();
const { storageSetJson, storageGetJson } = useStorage();

const data = ref();

// Use the debounce composable
const { debounce } = useDebounce(500);

const saveData = async () => {
  await storageSetJson(props.id, {
    type: 'remarks',
    value: data.value,
  });
};

const debouncedSaveData = debounce(saveData);

onMounted(async () => {
  const storedData = await storageGetJson(props.id);
  if (storedData) {
    data.value = storedData.value;
  }
});

const isComplete = computed(() => {
  return !!data.value;
});

defineExpose({
  isComplete,
});
</script>

<template>
  <div class="remarks ion-margin-bottom">
    <ion-label class="form-input-label">{{ label }}:</ion-label>
    <ion-textarea
      autocomplete="on"
      autocorrect="on"
      autocapitalize="on"
      :spellcheck="true"
      :auto-grow="true"
      v-model="data"
      @ionChange="debouncedSaveData"
      fill="solid">
    </ion-textarea>
  </div>
</template>

<style lang="css" scoped></style>
