<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { IonLabel, IonInput } from '@ionic/vue';
import { ComponentProps } from '@/types';
import { useDebounce } from '@/composables/useDebounce';
import { useStorage } from '@/composables/useStorage';

const props = defineProps<ComponentProps>();

const { storageSet, storageGet } = useStorage();
const data = ref();

// Create debounced functions
const { debounce } = useDebounce(500);

const saveData = async () => {
  // Debounced save function for text inputs
  await storageSet(props.id, data.value);
};

const saveDataNumber = async () => {
  // Debounced save function for number inputs
  await storageSet(props.id, data.value);
};

// Create debounced versions of the save functions
const debouncedSaveData = debounce(saveData);
const debouncedSaveDataNumber = debounce(saveDataNumber);

onMounted(async () => {
  const storedData = await storageGet(props.id);
  if (storedData) {
    data.value = storedData;
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
  <div class="form-input ion-margin-bottom">
    <ion-label class="form-input-label">{{ label }}:</ion-label>
    <ion-input
      v-if="field === 'text'"
      type="text"
      v-model="data"
      @ionChange="debouncedSaveData"
      autocomplete="on"
      autocorrect="on"
      autocapitalize="on"
      :spellcheck="true"
      fill="solid"></ion-input>
    <ion-input
      v-if="field === 'number'"
      type="number"
      pattern="[0-9]*"
      v-model="data"
      @ionChange="debouncedSaveDataNumber"
      min="0"
      fill="solid"></ion-input>
  </div>
</template>

<style lang="css" scoped></style>
