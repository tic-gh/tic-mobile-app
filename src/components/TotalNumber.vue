<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { IonLabel, IonInput, IonGrid, IonRow, IonCol } from '@ionic/vue';
import { ComponentProps } from '@/types';
import { useStorage } from '@/composables/useStorage';
import { useDebounce } from '@/composables/useDebounce';
import { useI18n } from 'vue-i18n';

const props = defineProps<ComponentProps>();
const { t } = useI18n();

// Initialize storage and debounce
const { storageSetJson, storageGetJson } = useStorage();
const { debounce } = useDebounce(500);

// Define the total data structure
interface TotalData {
  package_opened: {
    label: string;
    value?: number;
    error?: boolean;
    message?: string;
  };
  package_inspected: {
    label: string;
    value?: number;
    error?: boolean;
    message?: string;
  };
  stickers_used: {
    label: string;
    value?: number;
    error?: boolean;
    message?: string;
  };
}

// Initialize total data with default values
const data = ref<TotalData>({
  package_opened: {
    label: t('total_package_open'),
    value: undefined,
  },
  package_inspected: {
    label: t('total_package_inspected'),
    value: undefined,
  },
  stickers_used: {
    label: t('total_stickers_used'),
    value: undefined,
  },
});

// Update labels when language changes
const updateLabels = () => {
  data.value.package_opened.label = t('total_package_open');
  data.value.package_inspected.label = t('total_package_inspected');
  data.value.stickers_used.label = t('total_stickers_used');
};

// Save data function
const saveData = async () => {
  try {
    await storageSetJson(props.id, data.value);
  } catch (error) {
    console.error('Error saving total data:', error);
  }
};

// Create debounced version of saveData
const debouncedSaveData = debounce(saveData);

// Load data on mount
onMounted(async () => {
  const storedData = await storageGetJson(props.id);
  if (storedData) {
    data.value = storedData;
  }
  // Update labels after loading data
  updateLabels();
});

// Computed property to check if component is complete
const isComplete = computed(() => {
  return data.value.package_opened.value &&
    data.value.package_inspected.value &&
    data.value.stickers_used.value
    ? true
    : false;
});

// Expose the isComplete property
defineExpose({
  isComplete,
});
</script>

<template>
  <ion-grid class="total-number ion-no-padding ion-margin-bottom">
    <ion-row>
      <ion-col>
        <div class="form-input ion-margin-bottom">
          <ion-label class="form-input-label">{{ data.package_opened.label }}:</ion-label>
          <ion-input
            type="number"
            v-model="data.package_opened.value"
            @ionChange="debouncedSaveData"
            pattern="[0-9]*"
            min="0"
            fill="solid"></ion-input>
        </div>
        <small v-if="data.package_opened.error" class="danger">
          {{ data.package_opened.message }}
        </small>
      </ion-col>
    </ion-row>
    <ion-row>
      <ion-col>
        <div class="form-input ion-margin-bottom">
          <ion-label class="form-input-label">{{ data.package_inspected.label }}:</ion-label>
          <ion-input
            type="number"
            v-model="data.package_inspected.value"
            @ionChange="debouncedSaveData"
            pattern="[0-9]*"
            min="0"
            fill="solid"></ion-input>
        </div>
        <small v-if="data.package_inspected.error" class="danger">
          {{ data.package_inspected.message }}
        </small>
      </ion-col>
    </ion-row>
    <ion-row>
      <ion-col>
        <div class="form-input ion-margin-bottom">
          <ion-label class="form-input-label">{{ data.stickers_used.label }}:</ion-label>
          <ion-input
            type="number"
            v-model="data.stickers_used.value"
            @ionChange="debouncedSaveData"
            pattern="[0-9]*"
            min="0"
            fill="solid"></ion-input>
        </div>
        <small v-if="data.stickers_used.error" class="danger">
          {{ data.stickers_used.message }}
        </small>
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<style lang="css" scoped>
.danger {
  color: var(--ion-color-danger);
  padding: 8px;
}
</style>
