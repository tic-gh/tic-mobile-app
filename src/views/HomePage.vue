<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonMenuButton,
  IonTitle,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonFooter,
  IonImg,
} from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStorage } from '@/composables/useStorage';
import { useInit } from '@/composables/useInit';
import { useLocation } from '@/composables/useLocation';
import { Geolocation } from '@capacitor/geolocation';
import { useGeofence } from '@/composables/useGeofence';
import { useLoading } from '@/composables/useLoading';

const { loadingShow, loadingHide } = useLoading();
const { loadGeofences, activeGeofences, addGeofence } = useGeofence();
const router = useRouter();
const { t } = useI18n();
const { storageGetJson, storageSetJson } = useStorage();
const download = ref();
const user = ref();
const versionNumber = ref(import.meta.env.VITE_APP_VER_NO);
const wording = ref(t('start_inspection'));
// Location composable
const { getGeoLocation } = useLocation();

useInit(async () => {
  download.value = await storageGetJson('download');
  user.value = await storageGetJson('user');
  await loadGeofences();
  wording.value = download.value?.startTime ? t('continue_inspection') : t('start_inspection');
});

// Date formatting function
const formatDate = (date: string, format: string): string => {
  if (!date) return '';

  const dateObj = new Date(date);

  if (format === 'longDate') {
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  if (format === 'medium') {
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return dateObj.toLocaleDateString();
};

const startInspection = async () => {
  try {
    await loadingShow({
      message: `${wording.value}..${t('please_wait')}...`,
    });
    // Check if location is enabled (using Capacitor Geolocation)
    const permission = await Geolocation.checkPermissions();
    if (permission.location === 'denied') {
      throw new Error('Error getting current position please allow location permission!');
    }

    // Get current position
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 300000,
    });

    await getGeoLocation(position);

    if (!download.value.startTime) {
      wording.value = t('continue_inspection');
      download.value.startTime = new Date().getTime();
      await storageSetJson('download', download.value);
    }

    // if (activeGeofences.value.length === 0) {
    //   await addGeofence({
    //     name: 'Inspection Reminder',
    //     latitude: position?.coords.latitude ?? 0,
    //     longitude: position?.coords.longitude ?? 0,
    //     radius: 1000,
    //     exitMessage: t('geofence_exit_message_manual'),
    //     isActive: true
    //   })
    // }
    await loadingHide();
    // Navigate to list page using router with proper navigation
    await router.push('/list');
  } catch (err) {
    console.log(err);
  }
};
</script>

<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-menu-button menu="main-menu"></ion-menu-button>
      </ion-buttons>
      <ion-title>{{ t('home') }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-card>
      <ion-img src="/images/logo.png" class="img-logo" alt="TIC logo" />
      <ion-card-content>
        <ion-card-title class="orange-title">
          {{ download?.inspection.reference_number }}
        </ion-card-title>
        <ion-grid>
          <ion-row>
            <ion-col
              ><strong>{{ t('inspection_date') }}:</strong></ion-col
            >
            <ion-col>{{ formatDate(download?.inspection.inspection_date, 'longDate') }}</ion-col>
          </ion-row>
          <ion-row>
            <ion-col
              ><strong>{{ t('service_type') }}:</strong></ion-col
            >
            <ion-col>{{ download?.inspection.service.toUpperCase() }}</ion-col>
          </ion-row>
          <ion-row>
            <ion-col
              ><strong>{{ t('downloaded') }}:</strong></ion-col
            >
            <ion-col>{{ formatDate(download?.downloadTime, 'medium') }}</ion-col>
          </ion-row>
          <ion-row v-if="download?.factory.factory_address">
            <ion-col
              ><strong>{{ t('place_of_inspection') }}:</strong></ion-col
            >
            <ion-col>{{ download?.factory.factory_address }}</ion-col>
          </ion-row>
          <ion-row v-if="download?.factory.factory_name">
            <ion-col
              ><strong>{{ t('factory_name') }}:</strong></ion-col
            >
            <ion-col>{{ download?.factory.factory_name }}</ion-col>
          </ion-row>
          <ion-row v-if="download?.factory_contact.factory_contact_person">
            <ion-col
              ><strong>{{ t('contact_person') }}:</strong></ion-col
            >
            <ion-col>{{ download?.factory_contact.factory_contact_person }}</ion-col>
          </ion-row>
          <ion-row v-if="download?.factory_contact.factory_contact_number">
            <ion-col
              ><strong>{{ t('contact_number') }}:</strong></ion-col
            >
            <ion-col>{{ download?.factory_contact.factory_contact_number }}</ion-col>
          </ion-row>
        </ion-grid>
        <ion-button expand="block" color="energize" size="large" @click="startInspection">
          {{ wording }}
        </ion-button>
      </ion-card-content>
    </ion-card>
  </ion-content>

  <ion-footer class="ion-no-border">
    <ion-toolbar>
      <div class="version">
        <small>App Version: {{ versionNumber }}</small>
      </div>
    </ion-toolbar>
  </ion-footer>
</template>

<style lang="css" scoped>
.img-logo {
  max-width: 100%;
  margin: 30px auto;
}
.orange-title {
  color: #f8852e;
  font-weight: bold;
  text-align: center;
}
.button.button-energized {
  border-color: transparent;
  background-color: #ffc900;
  color: #fff;
}
.title-md {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  text-align: center;
}
.version {
  text-align: center;
  padding: 5px 0;
}
</style>
