<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
  IonInput,
  IonImg,
  IonIcon,
  IonActionSheet,
  IonLoading,
  IonToast,
  IonRadio,
  IonRadioGroup,
} from '@ionic/vue';
import { useStorage } from '@/composables/useStorage';
import { useCamera } from '@/composables/useCamera';
import { useDebounce } from '@/composables/useDebounce';
import { CameraResultType } from '@capacitor/camera';
import { camera, removeCircle } from 'ionicons/icons';
import { ComponentProps } from '@/types';

const props = defineProps<ComponentProps>();

const { storageSetJson, storageGetJson } = useStorage();
const { takePhoto, isLoading, error, hasError, clearError, checkAvailability } = useCamera();

// Use the debounce composable
const { debounce } = useDebounce(500);

const isActionSheetOpen = ref(false);
const currentAction = ref<string>('');

interface PalletizedData {
  palletsLoadedOption: string;
  material: {
    label: string;
    value: string;
  };
  materialPicture: {
    label: string;
    value: string;
  };
  fumigationStampPicture: {
    label: string;
    value: string;
  };
  palletsLoaded: {
    label: string;
    value: string;
  };
  palletsFrom: {
    label: string;
    value: string;
  };
  palletsTo: {
    label: string;
    value: string;
  };
}

const palletized = ref<PalletizedData>({
  palletsLoadedOption: '',
  material: {
    label: 'Specify the material of the Pallet',
    value: '',
  },
  materialPicture: {
    label: "Pallet's Material",
    value: '',
  },
  fumigationStampPicture: {
    label: "Fumigation's Stamp",
    value: '',
  },
  palletsLoaded: {
    label: 'Number of Pallets Loaded',
    value: '',
  },
  palletsFrom: {
    label: 'From Pallet No',
    value: '',
  },
  palletsTo: {
    label: 'To',
    value: '',
  },
});

const saveData = async () => {
  await storageSetJson(props.id, palletized.value);
};

const debouncedSaveData = debounce(saveData);

const palletsLoaded = async () => {
  if (palletized.value.palletsLoadedOption === 'no') {
    palletized.value.palletsLoaded.value = 'N/A';
  } else {
    palletized.value.palletsLoaded.value = '';
  }
  await saveData();
};

const showActionMaterialPicture = async (): Promise<string> => {
  return new Promise((resolve) => {
    currentAction.value = 'material';
    isActionSheetOpen.value = true;

    // Store the resolve function to use in template handlers
    (window as any).__actionSheetResolve = resolve;
  });
};

const showActionFumigationStampPicture = async (): Promise<string> => {
  return new Promise((resolve) => {
    currentAction.value = 'fumigation';
    isActionSheetOpen.value = true;

    // Store the resolve function to use in template handlers
    (window as any).__actionSheetResolve = resolve;
  });
};

const handleActionSheetAction = async (action: string) => {
  isActionSheetOpen.value = false;
  const resolve = (window as any).__actionSheetResolve;
  if (resolve) {
    resolve(action);
    delete (window as any).__actionSheetResolve;
  }
};

const openCamera = async (who: string) => {
  try {
    let action: string;

    if (who === 'fumigation') {
      action = await showActionFumigationStampPicture();
    } else {
      action = await showActionMaterialPicture();
    }

    if (action === 'take-picture') {
      await takePhotoOnly(who);
    } else if (action === 'N/A') {
      if (who === 'fumigation') {
        palletized.value.fumigationStampPicture.value = 'N/A';
      } else {
        palletized.value.materialPicture.value = 'N/A';
      }
      await saveData();
    }
  } catch (err) {
    console.error('Error in openCamera:', err);
  }
};

const takePhotoOnly = async (who: string) => {
  try {
    const image = await takePhoto(false, {
      quality: 90,
      resultType: CameraResultType.Uri,
    });

    if (image) {
      if (who === 'fumigation') {
        palletized.value.fumigationStampPicture.value = image.webPath;
      } else {
        palletized.value.materialPicture.value = image.webPath;
      }
      await saveData();
    }
  } catch (err) {
    console.error('Error taking photo:', err);
  }
};

const saveDataNumber = async (num: number) => {
  if (num >= 0) {
    await saveData();
  }
};

// Initialize component
onMounted(async () => {
  // Load stored data
  const storedData = await storageGetJson(props.id);
  if (storedData) {
    palletized.value = storedData;
  }

  // Check camera availability on mount
  await checkAvailability();
});

const isComplete = computed(() => {
  // Check if material is filled
  if (!palletized.value.material.value.trim()) {
    return false;
  }

  // Check if material picture is provided (either image or N/A)
  if (!palletized.value.materialPicture.value) {
    return false;
  }

  // Check if fumigation stamp picture is provided (either image or N/A)
  if (!palletized.value.fumigationStampPicture.value) {
    return false;
  }

  // Check if pallets loaded option is selected
  if (!palletized.value.palletsLoadedOption) {
    return false;
  }

  // If pallets loaded is "yes", check if number is provided
  if (palletized.value.palletsLoadedOption === 'yes' && !palletized.value.palletsLoaded.value) {
    return false;
  }

  // Check if pallets from number is provided
  if (!palletized.value.palletsFrom.value) {
    return false;
  }

  // Check if pallets to number is provided
  if (!palletized.value.palletsTo.value) {
    return false;
  }

  return true;
});

// Expose the isComplete computed property
defineExpose({
  isComplete,
});
</script>

<template>
  <ion-grid class="palletized-cargo ion-no-padding ion-margin-bottom">
    <ion-row>
      <ion-col>
        <div>
          <ion-label class="form-input-label">{{ palletized.material.label }}</ion-label>
          <ion-input
            type="text"
            v-model="palletized.material.value"
            @ionChange="debouncedSaveData()"
            autocomplete="on"
            autocorrect="on"
            autocapitalize="on"
            :spellcheck="true"
            class="custom-input">
          </ion-input>
        </div>
      </ion-col>
    </ion-row>

    <ion-row>
      <ion-col class="ion-padding-bottom">
        <div v-if="palletized.materialPicture.value && palletized.materialPicture.value !== 'N/A'">
          <div
            class="photo-thumbnail"
            :style="{ 'background-image': 'url(' + palletized.materialPicture.value + ')' }"
            @click="openCamera('material')">
            <div class="input-label">{{ palletized.materialPicture.label }}</div>
            <ion-img
              v-if="palletized.materialPicture.value !== 'N/A'"
              :src="palletized.materialPicture.value"
              class="thumbnail" />
          </div>
        </div>
        <div v-if="palletized.materialPicture.value === 'N/A'">
          <div class="image-title" @click="openCamera('material')">
            <div class="input-label">{{ palletized.materialPicture.label }}</div>
            <div class="take-photo">
              <ion-icon
                v-if="palletized.materialPicture.value === 'N/A'"
                :icon="removeCircle"
                class="danger-icon"></ion-icon>
            </div>
          </div>
        </div>
        <div v-if="!palletized.materialPicture.value">
          <div class="image-title" @click="openCamera('material')">
            <div class="input-label">{{ palletized.materialPicture.label }}</div>
            <div class="take-photo">
              <ion-icon :icon="camera" class="camera-icon"></ion-icon>
            </div>
          </div>
        </div>
      </ion-col>
    </ion-row>

    <ion-row>
      <ion-col class="ion-padding-bottom">
        <div
          v-if="
            palletized.fumigationStampPicture.value &&
            palletized.fumigationStampPicture.value !== 'N/A'
          ">
          <div
            class="photo-thumbnail"
            :style="{ 'background-image': 'url(' + palletized.fumigationStampPicture.value + ')' }"
            @click="openCamera('fumigation')">
            <div class="input-label">{{ palletized.fumigationStampPicture.label }}</div>
            <ion-img
              v-if="palletized.fumigationStampPicture.value !== 'N/A'"
              :src="palletized.fumigationStampPicture.value"
              class="thumbnail" />
          </div>
        </div>
        <div v-if="palletized.fumigationStampPicture.value === 'N/A'">
          <div class="image-title" @click="openCamera('fumigation')">
            <div class="input-label">{{ palletized.fumigationStampPicture.label }}</div>
            <div class="take-photo">
              <ion-icon
                v-if="palletized.fumigationStampPicture.value === 'N/A'"
                :icon="removeCircle"
                class="danger-icon"></ion-icon>
            </div>
          </div>
        </div>
        <div v-if="!palletized.fumigationStampPicture.value">
          <div class="image-title" @click="openCamera('fumigation')">
            <div class="input-label">{{ palletized.fumigationStampPicture.label }}</div>
            <div class="take-photo">
              <ion-icon :icon="camera" class="camera-icon"></ion-icon>
            </div>
          </div>
        </div>
      </ion-col>
    </ion-row>

    <ion-row>
      <ion-col>
        <div class="pallet-container">
          <ion-label class="form-input-label">Pallets Loaded?</ion-label>
          <ion-radio-group
            v-model="palletized.palletsLoadedOption"
            value="custom-checked"
            @ionChange="palletsLoaded()"
            fill="solid">
            <ion-radio value="yes" label-placement="end" mode="md">Yes</ion-radio>
            <ion-radio value="no" label-placement="end" mode="md">N/A</ion-radio>
          </ion-radio-group>
        </div>
      </ion-col>
    </ion-row>

    <ion-row v-if="palletized.palletsLoadedOption === 'yes'">
      <ion-col>
        <div>
          <ion-label class="form-input-label">Enter {{ palletized.palletsLoaded.label }}</ion-label>
          <ion-input
            type="number"
            v-model="palletized.palletsLoaded.value"
            pattern="[0-9]*"
            @ionChange="saveDataNumber(Number(palletized.palletsLoaded.value))"
            min="0"
            class="custom-input">
          </ion-input>
        </div>
      </ion-col>
    </ion-row>

    <ion-row>
      <ion-col>
        <div>
          <ion-label class="form-input-label">{{ palletized.palletsFrom.label }}</ion-label>
          <ion-input
            type="number"
            v-model="palletized.palletsFrom.value"
            pattern="[0-9]*"
            @ionChange="saveDataNumber(Number(palletized.palletsFrom.value))"
            min="0"
            class="custom-input">
          </ion-input>
        </div>
      </ion-col>
    </ion-row>

    <ion-row>
      <ion-col>
        <div>
          <ion-label class="form-input-label">{{ palletized.palletsTo.label }}</ion-label>
          <ion-input
            type="number"
            v-model="palletized.palletsTo.value"
            pattern="[0-9]*"
            @ionChange="saveDataNumber(Number(palletized.palletsTo.value))"
            min="0"
            class="custom-input">
          </ion-input>
        </div>
      </ion-col>
    </ion-row>

    <!-- Action Sheet for camera options -->
    <ion-action-sheet
      :is-open="isActionSheetOpen"
      header="Select Action"
      :buttons="[
        {
          text: 'Take Picture',
          icon: camera,
          handler: () => handleActionSheetAction('take-picture'),
        },
        {
          text: 'Not Applicable',
          icon: removeCircle,
          handler: () => handleActionSheetAction('N/A'),
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ]"
      @didDismiss="isActionSheetOpen = false"></ion-action-sheet>

    <!-- Loading indicator -->
    <ion-loading :is-open="isLoading" message="Processing image..." :duration="0"> </ion-loading>

    <!-- Error toast -->
    <ion-toast
      :is-open="hasError"
      :message="error?.message || 'An error occurred'"
      duration="3000"
      position="top"
      color="danger"
      @didDismiss="clearError">
    </ion-toast>
  </ion-grid>
</template>

<style lang="css" scoped>
.form-input-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--ion-color-dark);
  font-size: 0.875rem;
}

.custom-input {
  --background: #efefef;
  --border-style: solid;
  --border-width: 1px;
  --border-color: var(--ion-color-medium);
  --padding-start: 1rem;
  --padding-end: 1rem;
  --padding-top: 0.75rem;
  --padding-bottom: 0.75rem;
  margin-bottom: 1rem;
}

.take-photo {
  text-align: center;
  height: 250px;
  background-color: #bdbdbd;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-icon {
  margin-top: 20px;
  font-size: 2.5rem;
  background-color: #bdbdbd;
  color: var(--ion-color-medium);
}

.danger-icon {
  margin-top: 20px;
  font-size: 2.5rem;
  background-color: #bdbdbd;
  color: var(--ion-color-danger);
}

.photo-thumbnail {
  position: relative;
  max-height: 250px;
  overflow: hidden;
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  border-radius: 8px;
  margin: 0.5rem 0;
  cursor: pointer;
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
  position: absolute;
  width: 100%;
  padding: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 1;
  border-radius: 4px 4px 0 0;
}

.pallet-container {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

ion-radio {
  margin-left: 7px;
  margin-right: 20px;
}

ion-radio::part(container) {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 2px solid #ddd;
}

ion-radio::part(mark) {
  background: none;
  transition: none;
  transform: none;
  border-radius: 0;
}

ion-radio.radio-checked::part(container) {
  background: var(--ion-color-primary);
  border-color: transparent;
}

ion-radio.radio-checked::part(mark) {
  width: 6px;
  height: 10px;
  border-width: 0px 2px 2px 0px;
  border-style: solid;
  border-color: #fff;
  transform: rotate(45deg);
}
</style>
