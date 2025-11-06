<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { IonGrid, IonRow, IonCol, IonIcon, IonButton, IonTextarea, IonLabel } from '@ionic/vue';
import { ComponentProps, Remark } from '@/types';
import { useStorage } from '@/composables/useStorage';
import { useDebounce } from '@/composables/useDebounce';
import { add, close } from 'ionicons/icons';
import { useI18n } from 'vue-i18n';

const props = defineProps<ComponentProps>();
const { t } = useI18n();

const { storageGetJson, storageSetJson } = useStorage();

// Use the debounce composable
const { debounce } = useDebounce(500);

const data = ref<Remark[]>([]);

const saveData = async () => {
  await storageSetJson(props.id, data.value);
};

const debouncedSaveData = debounce(saveData);

const removeItem = (item: Remark) => {
  const index = data.value.findIndex((p) => p === item);
  if (index > -1) {
    data.value.splice(index, 1);
    saveData();
  }
};

const addNewItem = () => {
  const newItem: Remark = {
    type: 'multi-remarks',
    label: 'Remarks',
    value: '',
  };
  data.value.push(newItem);
  saveData();
};

// Initialize component
onMounted(async () => {
  // Initialize pictures array with stored data or default
  const storedData = await storageGetJson(props.id);
  if (storedData && Array.isArray(storedData)) {
    data.value = storedData;
  } else {
    // Initialize with one empty picture if no data exists
    data.value = [
      {
        type: 'multi-remarks',
        label: 'Remarks',
        value: '',
      },
    ];
  }
});

const isComplete = computed(() => {
  // Check if all remarks have non-empty values
  return (
    data.value.length > 0 && data.value.every((item) => item.value && item.value.trim() !== '')
  );
});

defineExpose({
  isComplete,
});
</script>

<template>
  <ion-grid class="multi-remarks ion-no-padding ion-margin-bottom">
    <ion-row class="ion-no-padding">
      <ion-col class="ion-no-padding">
        <section v-for="(item, i) in data" :key="`${id}-${i}`" class="section">
          <div class="remark-container">
            <ion-label class="form-input-label">{{ item.label }}:</ion-label>
            <ion-textarea
              :disabled="item.value == 'N/A'"
              autocomplete="on"
              autocorrect="on"
              autocapitalize="on"
              :spellcheck="true"
              :auto-grow="true"
              v-model="item.value"
              @ionChange="debouncedSaveData"
              fill="solid">
            </ion-textarea>
          </div>
          <ion-button v-if="i > 0" fill="clear" @click="removeItem(item)" style="float: right">
            <ion-icon :icon="close" slot="start"></ion-icon>
            {{ t('remove') }}
          </ion-button>
        </section>
        <ion-button fill="clear" @click="addNewItem" style="float: left">
          <ion-icon :icon="add" slot="start"></ion-icon>
          {{ t('add_new_remark') }}
        </ion-button>
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<style lang="css" scoped>
.custom-input {
  --background: #efefef;
  --border-style: solid;
  --border-width: 1px;
  --border-color: var(--ion-color-medium);
  --padding-start: 1rem;
  --padding-end: 1rem;
  --padding-top: 0.75rem;
  --padding-bottom: 0.75rem;
}

.section {
  margin-bottom: 50px;
}
.section:first-child {
  margin-bottom: 10px;
}
.remark-container {
  margin-top: 10px;
}
</style>
