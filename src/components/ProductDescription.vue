<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  IonLabel,
  IonTextarea,
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonIcon,
  IonButton,
  IonLoading,
  IonToast,
} from '@ionic/vue';
import { ComponentProps, Picture } from '@/types';
import { useStorage } from '@/composables/useStorage';
import { useCamera } from '@/composables/useCamera';
import { useDebounce } from '@/composables/useDebounce';
import { CameraResultType } from '@capacitor/camera';
import { camera, add, close } from 'ionicons/icons';
import { useI18n } from 'vue-i18n';

const props = defineProps<ComponentProps>();
const { t } = useI18n();

interface ProductDescription {
  type: string;
  description: string;
  pictures: Picture[];
}

const data = ref<ProductDescription[]>([]);

const { storageGetJson, storageSetJson } = useStorage();
const { takePhoto, isLoading, error, hasError, clearError, checkAvailability } = useCamera();

// Use the debounce composable
const { debounce } = useDebounce(500);

const saveData = async () => {
  await storageSetJson(props.id, data.value);
};

const debouncedSaveData = debounce(saveData);

const removePicture = (picture: Picture, i: number) => {
  const index = data.value[i].pictures.indexOf(picture);

  if (index > -1) {
    data.value[i].pictures.splice(index, 1);
  }
  saveData();
};

const addPicture = (i: number) => {
  data.value[i].pictures.push({
    type: 'take-picture',
    value: '',
    label: 'Image',
  });
  saveData();
};

const addNewProduct = () => {
  const newProduct: ProductDescription = {
    type: 'product-description',
    description: '',
    pictures: [
      {
        type: 'take-picture',
        value: '',
        label: 'Image',
      },
    ],
  };
  data.value.push(newProduct);
  saveData();
};

const removeProduct = (product: ProductDescription) => {
  const index = data.value.indexOf(product);

  if (index > -1) {
    data.value.splice(index, 1);
  }

  saveData();
};

const openCamera = async (picture: Picture) => {
  try {
    try {
      const image = await takePhoto(false, {
        quality: 90,
        resultType: CameraResultType.Uri,
      });

      if (image) {
        picture.value = image.webPath;
        await saveData();
      }
    } catch (err) {
      console.error('Error taking photo:', err);
    }
  } catch (err) {
    console.error('Error in openCamera:', err);
  }
};

// Initialize component
onMounted(async () => {
  // Initialize product descriptions array with stored data or default
  const storedData = await storageGetJson(props.id);
  if (storedData && Array.isArray(storedData)) {
    data.value = storedData;
  } else {
    // Initialize with one empty product description if no data exists
    data.value = [
      {
        type: 'product-description',
        description: '',
        pictures: [
          {
            type: 'take-picture',
            value: '',
            label: 'Image',
          },
        ],
      },
    ];
  }

  // Check camera availability on mount
  await checkAvailability();
});

const isComplete = computed(() => {
  // Check if there are any product descriptions in the data array
  if (data.value.length === 0) {
    return false;
  }

  // Check if all product descriptions have a description and at least one picture
  return data.value.every((product) => {
    const hasDescription = product.description && product.description.trim() !== '';

    // Check if all pictures have either a value (image) or are marked as "N/A"
    const allPicturesValid = product.pictures.every((picture) => {
      const hasValue = picture.value && picture.value.trim() !== '';

      return hasValue;
    });

    return hasDescription && allPicturesValid;
  });
});

defineExpose({
  isComplete,
});
</script>

<template>
  <ion-grid class="product-description ion-no-padding ion-margin-bottom">
    <ion-row>
      <ion-col>
        <section v-for="(product, i) in data" :key="`${id}-${i}`" class="section">
          <ion-grid class="section-content">
            <ion-row class="ion-padding-bottom">
              <ion-col>
                <ion-label class="form-input-label">{{ label }}:</ion-label>
                <ion-textarea
                  v-model="product.description"
                  @ionChange="debouncedSaveData"
                  :rows="6"
                  :auto-grow="true"
                  fill="solid">
                </ion-textarea>
              </ion-col>
            </ion-row>

            <ion-row class="ion-padding-bottom">
              <ion-col size="6" v-for="(picture, x) in product.pictures" :key="`${id}-${i}-${x}`">
                <div v-if="picture.value && picture.value !== 'N/A'">
                  <ion-button
                    @click="removePicture(picture, i)"
                    class="close"
                    fill="clear"
                    size="small">
                    <ion-icon :icon="close" slot="icon-only"></ion-icon>
                  </ion-button>
                  <ion-input
                    v-if="options?.editable"
                    type="text"
                    v-model="picture.label"
                    placeholder="Label"
                    @ionChange="debouncedSaveData"
                    style="border: 1px solid #ccc"
                    class="custom-input">
                  </ion-input>
                  <div class="input-label" v-if="!options?.editable">{{ label }}</div>
                  <div
                    class="photo-thumbnail"
                    v-if="picture.value"
                    :style="{ 'background-image': 'url(' + picture.value + ')' }"
                    @click="openCamera(picture)"></div>
                </div>
                <div v-if="!picture.value">
                  <ion-button
                    @click="removePicture(picture, i)"
                    class="close"
                    fill="clear"
                    size="small"
                    color="light">
                    <ion-icon :icon="close"></ion-icon>
                  </ion-button>
                  <ion-input
                    v-if="options?.editable"
                    type="text"
                    v-model="picture.label"
                    placeholder="Label"
                    @ionChange="debouncedSaveData"
                    style="border: 1px solid #ccc"
                    class="custom-input">
                  </ion-input>
                  <div class="image-title" @click="openCamera(picture)">
                    <div v-if="!options?.editable" class="input-label">{{ label }}</div>
                    <div class="take-photo">
                      <ion-icon :icon="camera" class="camera-icon"></ion-icon>
                    </div>
                  </div>
                </div>
              </ion-col>
              <ion-col size="6">
                <ion-button fill="clear" @click="addPicture(i)">
                  <ion-icon :icon="add" slot="start"></ion-icon>
                  {{ t('new_picture') }}
                </ion-button>
              </ion-col>
            </ion-row>
          </ion-grid>
          <ion-button
            v-if="i > 0"
            fill="clear"
            @click="removeProduct(product)"
            style="float: right">
            <ion-icon :icon="close" slot="start"></ion-icon>
            {{ t('remove') }}
          </ion-button>
        </section>
        <ion-button fill="clear" @click="addNewProduct()" style="float: left">
          <ion-icon :icon="add" slot="start"></ion-icon>
          {{ t('add_new') }} {{ label }}
        </ion-button>
      </ion-col>
    </ion-row>

    <!-- Loading indicator -->
    <ion-loading :is-open="isLoading" :message="t('processing_image')" :duration="0"> </ion-loading>

    <!-- Error toast -->
    <ion-toast
      :is-open="hasError"
      :message="error?.message || t('an_error_occurred')"
      :duration="3000"
      position="top"
      color="danger"
      @ionToastDidDismiss="clearError">
    </ion-toast>
  </ion-grid>
</template>

<style lang="css" scoped>
.take-photo {
  text-align: center;
  height: 150px;
  background-color: #bdbdbd;
  display: flex;
  align-items: center;
  justify-content: center;
}
.camera-icon {
  font-size: 2.5rem;
  background-color: #bdbdbd;
  color: var(--ion-color-medium);
}

.danger-icon {
  font-size: 2.5rem;
  background-color: #bdbdbd;
  color: var(--ion-color-danger);
}
.photo-thumbnail {
  position: relative;
  height: 150px;
  overflow: hidden;
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  border-radius: 0 0 4px 4px;
  transition: transform 0.2s ease;
}

.photo-thumbnail .thumbnail {
  width: 100%;
  height: auto;
  display: block;
}
.image-title {
  position: relative;
}
.input-label {
  background-color: rgba(0, 0, 0, 0.5);
  color: var(--ion-color-light);
  width: 100%;
  padding: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 4px 4px 0 0;
}
.close {
  position: absolute;
  right: 5px;
  top: 5px;
  z-index: 1;
}
ion-grid.section-content {
  padding: 0;

  --ion-grid-column-padding-xs: 5px;
  --ion-grid-column-padding-sm: 5px;
  --ion-grid-column-padding-md: 5px;
  --ion-grid-column-padding-lg: 5px;
  --ion-grid-column-padding-xl: 5px;
}
</style>
