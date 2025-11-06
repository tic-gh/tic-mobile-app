<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStorage } from '@/composables/useStorage';
import { useLocation } from '@/composables/useLocation';
import { useLoading } from '@/composables/useLoading';
import { sendAnswers } from '@/api/report';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonFooter,
  IonImg,
  alertController,
} from '@ionic/vue';
import { useGeofence } from '@/composables/useGeofence';
import { Geolocation } from '@capacitor/geolocation';
import { useInit } from '@/composables/useInit';

// Router and i18n
const router = useRouter();
const { t } = useI18n();
const { storageGetJson, storageSetJson, storageRemove } = useStorage();

// Location composable
const { startGeoLocation, stopGeoLocation, error: locationError, getCurrentPosition } = useLocation();

// Loading composable
const { loadingShow, loadingHide } = useLoading();

// Geofence
const { loadGeofences, activeGeofences, addGeofence, removeAllGeofence } = useGeofence();

// Reactive data
const startTime = ref<Date | null>(null);
const wording = ref(t('start_inspection'));
const download = ref();
const versionNumber = ref(import.meta.env.VITE_APP_VER_NO);

// Functions
const startInspection = async () => {
  if (startTime.value) {
    await stopInspection();
  } else {
    try {
      await loadingShow({
        message: `${t('start_inspection')}..${t('please_wait')}...`,
      });
      // Check if location is enabled (using Capacitor Geolocation)
      const permission = await Geolocation.checkPermissions();
      if (permission.location === 'denied') {
        throw new Error('Error getting current position please allow location permission!');
      }
      // Get current position
      const position = await getCurrentPosition({ enableHighAccuracy: true, timeout: 300000 });
      await startGeoLocation(position);
      startTime.value = new Date();
      wording.value = t('stop_inspection');
      download.value.startTime = new Date().getTime();
      await storageSetJson('download', download.value);

      if (activeGeofences.value.length === 0) {
        await addGeofence({
          name: 'Inspection Reminder',
          latitude: position?.coords.latitude ?? 0,
          longitude: position?.coords.longitude ?? 0,
          radius: 1000,
          exitMessage: t('geofence_exit_message_manual'),
          isActive: true
        })
      }

      await loadingHide();
    } catch (err) {
      console.log(err);
      await loadingHide();
      const errorMessage = locationError.value?.message || (err as string);
      await presentErrorAlert(errorMessage);
    }
  }
};

const stopInspection = async () => {
  await loadingShow({
    message: `${t('stop_inspection')}..${t('please_wait')}...`,
  });

  try {
    if (download.value?.report?.id && download.value?.downloadTime) {
      await sendAnswers(download.value.report.id, [], download.value.downloadTime);
    }
    const position = await getCurrentPosition({ enableHighAccuracy: true, timeout: 300000 });
    await stopGeoLocation(position);
    await removeAllGeofence();
    await loadingHide();
    await presentDoneAlert();
  } catch (err) {
    await loadingHide();
    await presentErrorAlert('Internet or server is down. Try again later.');
  }
};

const presentErrorAlert = async (message: string) => {
  const alert = await alertController.create({
    header: t('error'),
    subHeader: message,
    buttons: ['OK'],
  });
  await alert.present();
};

const presentDoneAlert = async () => {
  const alert = await alertController.create({
    header: t('done'),
    subHeader: 'Successfully finished inspection. Redirecting to Download Page',
    buttons: [
      {
        text: 'OK',
        handler: async () => {
          await storageRemove('download');
          router.push('/download');
        },
      },
    ],
  });
  await alert.present();
};

useInit(async () => {
  download.value = await storageGetJson('download');
  startTime.value = download.value?.startTime ? new Date(download.value.startTime) : null;
  wording.value = startTime.value ? t('stop_inspection') : t('start_inspection');
  await loadGeofences();
});
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="energize">
        <ion-title class="ion-text-center">{{ t('home') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-card>
        <ion-img src="/images/logo.png" class="img-logo" alt="TIC logo" />
        <ion-card-content>
          <ion-card-title class="orange-title ion-text-center">
            {{ download?.inspection.reference_number }}
          </ion-card-title>
          <ion-grid>
            <ion-row>
              <ion-col>
                <strong>{{ t('inspection_date') }}:</strong>
              </ion-col>
              <ion-col>{{ download?.inspection.inspection_date }}</ion-col>
            </ion-row>
            <ion-row>
              <ion-col>
                <strong>{{ t('service_type') }}:</strong>
              </ion-col>
              <ion-col>{{ download?.inspection.service.toUpperCase() }}</ion-col>
            </ion-row>
            <ion-row>
              <ion-col>
                <strong>{{ t('downloaded') }}:</strong>
              </ion-col>
              <ion-col>{{ download?.downloadTime }}</ion-col>
            </ion-row>
            <ion-row v-if="download?.factory.factory_address">
              <ion-col>
                <strong>{{ t('place_of_inspection') }}:</strong>
              </ion-col>
              <ion-col>{{ download?.factory.factory_address }}</ion-col>
            </ion-row>
            <ion-row v-if="download?.factory.factory_name">
              <ion-col>
                <strong>{{ t('factory_name') }}:</strong>
              </ion-col>
              <ion-col>{{ download?.factory.factory_name }}</ion-col>
            </ion-row>
            <ion-row v-if="download?.factory_contact.factory_contact_person">
              <ion-col>
                <strong>{{ t('contact_person') }}:</strong>
              </ion-col>
              <ion-col>{{ download?.factory_contact.factory_contact_person }}</ion-col>
            </ion-row>
            <ion-row v-if="download?.factory_contact.factory_contact_number">
              <ion-col>
                <strong>{{ t('contact_number') }}:</strong>
              </ion-col>
              <ion-col>{{ download?.factory_contact.factory_contact_number }}</ion-col>
            </ion-row>
            <ion-row>
              <ion-col>
                <strong>{{ t('start_time') }}:</strong>
              </ion-col>
              <ion-col>{{ startTime }}</ion-col>
            </ion-row>
          </ion-grid>
          <ion-button
            expand="block"
            color="energize"
            size="large"
            @click="startInspection"
            class="ion-margin-vertical">
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
  </ion-page>
</template>

<style lang="css" scoped>
.img-logo {
  max-width: 100%;
  margin: 30px auto;
  display: block;
}

.orange-title {
  color: #f8852e;
  font-weight: bold;
}

.button.button-danger {
  border-color: transparent;
  background-color: #f53d3d;
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

.spinner-container {
  text-align: center;
}

.spinner-box {
  margin-bottom: 10px;
}

.text-center {
  text-align: center;
}
</style>
