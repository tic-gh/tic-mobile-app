<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { IonGrid, IonRow, IonCol, IonButton, IonIcon } from '@ionic/vue';
import { add, close } from 'ionicons/icons';
import { ComponentProps } from '@/types';
import { useStorage } from '@/composables/useStorage';
import TakePicture from '@/components/TakePicture.vue';
import FormInput from '@/components/FormInput.vue';
import DateTimeInput from './DateTimeInput.vue';
import Remarks from './RemarksComponent.vue';
import ComboBoxCondition from './ComboBoxCondition.vue';
import MultiTakePicture from './MultiTakePicture.vue';
import ProductDescription from './ProductDescription.vue';

const { storageRemove, storageGetJson, storageSetJson } = useStorage();
const props = defineProps<ComponentProps>();
const { t } = useI18n();
const componentRef = ref<any>({});
const data = ref<any[]>([]);

// Component mapping for dynamic rendering
const componentMap = {
  'form-input': FormInput,
  'combo-box-condition': ComboBoxCondition,
  'take-picture': TakePicture,
  'multi-take-picture': MultiTakePicture,
  remarks: Remarks,
  'product-description': ProductDescription,
  'date-time-input': DateTimeInput,
};

const addNew = () => {
  data.value.push(props.options);

  storageSetJson(props.id, data.value);
};

const remove = () => {
  if (data.value.length > 1) {
    const indexToRemove = data.value.length - 1;
    const rowToRemove = data.value[indexToRemove];

    // Remove storage for each component in the row being removed
    rowToRemove.forEach((component: any) => {
      storageRemove(component.key + indexToRemove);
    });

    data.value.pop();
  }

  storageSetJson(props.id, data.value);
};

const getBind = (component: any, i: number) => {
  return {
    id: component.key + i,
    ...component,
  };
};

onMounted(async () => {
  const storedData = await storageGetJson(props.id);
  if (storedData) {
    data.value = storedData;
  } else {
    data.value.push(props.options);
    storageSetJson(props.id, data.value);
  }
});

const isComplete = computed(() => {
  // Check if there's any data
  if (!data.value || data.value.length === 0) {
    return false;
  }

  // Check each row
  for (let rowIndex = 0; rowIndex < data.value.length; rowIndex++) {
    const row = data.value[rowIndex];

    // Check each component in the row
    for (const component of row) {
      const componentKey = component.key + rowIndex;
      const ref = componentRef.value[componentKey];

      // If component reference doesn't exist or doesn't have isComplete, consider incomplete
      if (!ref || typeof ref.isComplete === 'undefined') {
        return false;
      }

      // Check if the component is complete
      if (!ref.isComplete) {
        return false;
      }
    }
  }

  return true;
});

defineExpose({
  isComplete,
});
</script>

<template>
  <ion-grid class="custom-table ion-no-padding ion-margin-bottom">
    <ion-row>
      <ion-col>
        <div :class="{ border: i > 0 }" v-for="(components, i) in data" :key="i">
          <template v-for="component in components" :key="component.key">
            <component
              :is="componentMap[component.component as keyof typeof componentMap]"
              v-bind="getBind(component, i)"
              :ref="(el: any) => (componentRef[component.key + i] = el)" />
          </template>
        </div>
        <ion-button fill="clear" @click="addNew" style="float: left">
          <ion-icon :icon="add" slot="start" />
          {{ t('add_new') }}
        </ion-button>
        <ion-button v-if="data?.length > 1" fill="clear" @click="remove" style="float: right">
          <ion-icon :icon="close" slot="start" />
          {{ t('remove_last') }}
        </ion-button>
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<style lang="css" scoped>
.border {
  border-top: 5px dotted #ccc;
  padding-top: 10px;
}
</style>
