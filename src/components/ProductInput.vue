<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { IonGrid, IonRow, IonCol, IonLabel, IonInput, IonButton, IonIcon } from '@ionic/vue';
import { add, close } from 'ionicons/icons';
import { useI18n } from 'vue-i18n';
import { ComponentProps } from '@/types';
import { useStorage } from '@/composables/useStorage';
import { useDebounce } from '@/composables/useDebounce';

const props = defineProps<ComponentProps>();
const { t } = useI18n();
const { storageSetJson, storageGetJson } = useStorage();
const { debounce } = useDebounce(500);

interface ProductInputOption {
  label: string;
  field: 'text' | 'number';
  value: string | number;
}

interface ProductInputItem {
  type: string;
  options: ProductInputOption[];
}

const data = ref<ProductInputItem[]>([]);

const saveData = async () => {
  await storageSetJson(props.id, data.value);
};

const debouncedSaveData = debounce(saveData);

const addNewProduct = () => {
  data.value.push({
    type: 'product-input',
    options: JSON.parse(JSON.stringify(props.options)),
  });
  saveData();
};

const removeProduct = (index: number) => {
  data.value.splice(index, 1);
  saveData();
};

onMounted(async () => {
  const stored = await storageGetJson(props.id);
  if (stored && Array.isArray(stored)) {
    data.value = stored;
  } else {
    // Initialize with one product by default
    addNewProduct();
  }
});

const isComplete = computed(() => {
  if (!data.value.length) return false;
  return data.value.every((product) =>
    product.options.every(
      (option) => option.value !== '' && option.value !== null && option.value !== undefined
    )
  );
});

defineExpose({
  isComplete,
});
</script>

<template>
  <ion-grid class="product-input ion-no-padding ion-margin-bottom">
    <ion-row>
      <ion-col>
        <ion-label class="form-input-label">{{ t('product_items') }}:</ion-label>
        <section v-for="(product, i) in data" :key="i" class="border">
          <ion-grid>
            <ion-row v-for="(option, j) in product.options" :key="j">
              <ion-col>
                <div class="form-input ion-margin-bottom">
                  <ion-label class="form-input-label">{{ option.label }}</ion-label>
                  <ion-input
                    v-if="option.field === 'text'"
                    type="text"
                    v-model="product.options[j].value"
                    @ionChange="debouncedSaveData"
                    autocomplete="on"
                    autocorrect="on"
                    autocapitalize="on"
                    :spellcheck="true"
                    fill="solid" />
                  <ion-input
                    v-else-if="option.field === 'number'"
                    type="number"
                    v-model="product.options[j].value"
                    @ionChange="debouncedSaveData"
                    pattern="[0-9]*"
                    min="0"
                    fill="solid" />
                </div>
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col>
                <ion-button
                  v-if="i > 0"
                  fill="clear"
                  @click="removeProduct(i)"
                  style="float: right"
                  size="small">
                  <ion-icon :icon="close" slot="start" />
                  {{ t('remove') }}
                </ion-button>
              </ion-col>
            </ion-row>
          </ion-grid>
        </section>
        <ion-button fill="clear" @click="addNewProduct" style="float: left">
          <ion-icon :icon="add" slot="start" />
          {{ t('add_new_po') }}
        </ion-button>
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<style lang="css" scoped>
.product-input {
  width: 100%;
}
.form-input-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: block;
}
.border {
  border-bottom: 2px solid #ccc;
}
</style>
