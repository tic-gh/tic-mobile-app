<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { IonItem, IonLabel, IonInput, IonIcon } from '@ionic/vue';
import { calendar } from 'ionicons/icons';
import { DatetimePicker } from '@capawesome-team/capacitor-datetime-picker';
import { ComponentProps } from '@/types';
import { useStorage } from '@/composables/useStorage';
import { format as formatDate } from 'date-fns';

const props = defineProps<ComponentProps>();
const { storageSet, storageGet } = useStorage();

const data = ref<string>('');
const isLoading = ref(false);

const mode = computed(() => {
  if (props.field === 'date') return 'date';
  if (props.field === 'time' || props.field === 'time12' || props.field === 'time24') return 'time';
  return 'datetime';
});

const format = computed(() => {
  if (mode.value === 'date') return 'yyyy-MM-dd';
  if (mode.value === 'time') return 'HH:mm';
  return "yyyy-MM-dd'T'HH:mm";
});

const showDateTimePicker = async () => {
  if (isLoading.value) return; // Prevent multiple opens
  isLoading.value = true;
  try {
    if (!data.value) {
      const { value } = await DatetimePicker.present({
        mode: mode.value,
        value: formatDate(new Date(), format.value),
        format: format.value,
        cancelButtonText: 'Cancel',
        doneButtonText: 'OK',
        theme: 'auto',
        locale: 'en-US',
      });
      if (value) {
        data.value = value;
        await storageSet(props.id, data.value);
      }
    } else {
      const { value } = await DatetimePicker.present({
        mode: mode.value,
        value: data.value,
        format: format.value,
        cancelButtonText: 'Cancel',
        doneButtonText: 'OK',
        theme: 'auto',
        locale: 'en-US',
      });
      if (value) {
        data.value = value;
        await storageSet(props.id, data.value);
      }
    }
  } catch (err) {
    // User cancelled or error
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  const storedData = await storageGet(props.id);
  if (storedData) {
    data.value = storedData;
  }
});

const isComplete = computed(() => !!data.value);

defineExpose({
  isComplete,
});
</script>

<template>
  <div class="form-input ion-margin-bottom">
    <ion-label class="form-input-label">{{ props.label }}:</ion-label>
    <ion-item lines="none" button @click="showDateTimePicker">
      <ion-input readonly :value="data" :placeholder="props.label" fill="solid"></ion-input>
      <ion-icon :icon="calendar" slot="end"></ion-icon>
    </ion-item>
  </div>
</template>

<style lang="css" scoped>
ion-item::part(native) {
  padding-left: 0;
}
.form-input-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--ion-color-dark);
  font-size: 0.875rem;
}
</style>
