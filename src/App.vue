<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { useStorage } from '@/composables/useStorage';
import { useLoading } from '@/composables/useLoading';
import { useLocation } from '@/composables/useLocation';
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenuToggle,
  IonNote,
  IonFooter,
  alertController,
} from '@ionic/vue';
import {
  homeSharp,
  homeOutline,
  listSharp,
  listOutline,
  cloudDownloadSharp,
  cloudDownloadOutline,
  logOutSharp,
  logOutOutline,
} from 'ionicons/icons';
import { SafeArea } from 'capacitor-plugin-safe-area';
import { Geolocation } from '@capacitor/geolocation';
import { useGeofence } from '@/composables/useGeofence';

const { loadGeofences, activeGeofences, addGeofence, removeAllGeofence } = useGeofence();
const { t } = useI18n();
const { getGeoLocation } = useLocation();
const { storageGetJson, storageSetJson, storageClear } = useStorage();
const { loadingShow, loadingHide } = useLoading();
const router = useRouter();
const route = useRoute();
const versionNumber = ref(import.meta.env.VITE_APP_VER_NO);

// Compute whether split-pane should be disabled based on current route
const isSplitPaneDisabled = computed(() => {
  const currentPath = route.path;
  return currentPath === '/login' || currentPath === '/download' || currentPath === '/complex-home';
});

const appPages = [
  {
    title: t('home'),
    url: '/home',
    iosIcon: homeOutline,
    mdIcon: homeSharp,
  },
  {
    title: t('inspection_list'),
    url: '/list',
    iosIcon: listOutline,
    mdIcon: listSharp,
  },
  {
    title: t('download_new_report'),
    url: '/download',
    iosIcon: cloudDownloadOutline,
    mdIcon: cloudDownloadSharp,
  },
];

const logoutPrompt = async () => {
  try {
    const confirm = await alertController.create({
      header: t('confirm_logout'),
      message: t('logout_message'),
      buttons: [
        {
          text: t('cancel'),
          role: 'cancel',
        },
        {
          text: t('logout'),
          handler: () => {
            logout();
          },
        },
      ],
    });
    await confirm.present();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

const logout = async () => {
  await loadingShow({ message: `${t('logging_out')}...` });
  const remember = await storageGetJson('remember');
  // Clear stored data
  localStorage.removeItem('access_token');
  await storageClear();
  if (remember) {
    await storageSetJson('remember', remember);
  }
  await removeAllGeofence();
  await loadingHide();
  router.push('/login');
};

const handler = async (page: string) => {
  if (page === 'Inspection List') {
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
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 300000,
      });

      await getGeoLocation(position);

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
    } catch (err) {
      console.log(err);
    }
  }
};

onMounted(async () => {
  await loadGeofences();
  try {
    SafeArea.getSafeAreaInsets().then((data) => {
      const { insets } = data;
      document.body.style.setProperty('--ion-safe-area-top', `${insets.top}px`);
      document.body.style.setProperty('--ion-safe-area-right', `${insets.right}px`);
      document.body.style.setProperty('--ion-safe-area-bottom', `${insets.bottom}px`);
      document.body.style.setProperty('--ion-safe-area-left', `${insets.left}px`);
    });
  } catch (error) {
    console.warn('SafeArea plugin not available or failed:', error);
  }
});
</script>

<template>
  <ion-app>
    <ion-split-pane content-id="main-content" :disabled="isSplitPaneDisabled">
      <ion-menu menu-id="main-menu" content-id="main-content" type="overlay" :swipe-gesture="false">
        <ion-content>
          <ion-list id="inbox-list">
            <ion-list-header class="ion-text-uppercase">Menu</ion-list-header>
            <ion-note></ion-note>
            <ion-menu-toggle :auto-hide="false" v-for="(p, i) in appPages" :key="i">
              <ion-item @click="handler(p.title)" :href="p.url" lines="none" :detail="false" button>
                <ion-icon slot="start" :ios="p.iosIcon" :md="p.mdIcon"></ion-icon>
                <ion-label>{{ p.title }}</ion-label>
              </ion-item>
            </ion-menu-toggle>
            <ion-menu-toggle :auto-hide="false">
              <ion-item @click="logoutPrompt" lines="none" :detail="false" button>
                <ion-icon slot="start" :ios="logOutOutline" :md="logOutSharp"></ion-icon>
                <ion-label>{{ t('logout') }}</ion-label>
              </ion-item>
            </ion-menu-toggle>
          </ion-list>
        </ion-content>
        <ion-footer class="ion-no-border">
          <div class="version">
            <small>App Version: {{ versionNumber }}</small>
          </div>
        </ion-footer>
      </ion-menu>
      <div class="ion-page" id="main-content">
        <router-view />
      </div>
    </ion-split-pane>
  </ion-app>
</template>

<style scoped>
ion-menu ion-content {
  --background: var(--ion-item-background, var(--ion-background-color, #fff));
}
ion-menu.md ion-content {
  --padding-start: 8px;
  --padding-end: 8px;
  --padding-top: 20px;
  --padding-bottom: 20px;
}
ion-menu.md ion-list {
  padding: 20px 0;
}
ion-menu.md ion-note {
  margin-bottom: 30px;
}
ion-menu.md ion-list-header,
ion-menu.md ion-note {
  padding-left: 10px;
}
ion-menu.md ion-list#inbox-list ion-list-header {
  font-size: 22px;
  font-weight: 600;
  min-height: 20px;
}
ion-menu.md ion-list#labels-list ion-list-header {
  font-size: 16px;
  margin-bottom: 18px;
  color: #757575;
  min-height: 26px;
}
ion-menu.md ion-item {
  --padding-start: 10px;
  --padding-end: 10px;
  border-radius: 4px;
}
ion-menu.md ion-item.selected {
  --background: rgba(var(--ion-color-primary-rgb), 0.14);
}
ion-menu.md ion-item.selected ion-icon {
  color: var(--ion-color-primary);
}
ion-menu.md ion-item ion-icon {
  color: #616e7e;
}
ion-menu.md ion-item ion-label {
  font-weight: 500;
}
ion-menu.ios ion-content {
  --padding-bottom: 20px;
}
ion-menu.ios ion-list {
  padding: 20px 0 0 0;
}
ion-menu.ios ion-note {
  line-height: 24px;
  margin-bottom: 20px;
}
ion-menu.ios ion-item {
  --padding-start: 16px;
  --padding-end: 16px;
  --min-height: 50px;
}
ion-menu.ios ion-item.selected ion-icon {
  color: var(--ion-color-primary);
}
ion-menu.ios ion-item ion-icon {
  font-size: 24px;
  color: #73849a;
}
ion-menu.ios ion-list#labels-list ion-list-header {
  margin-bottom: 8px;
}
ion-menu.ios ion-list-header,
ion-menu.ios ion-note {
  padding-left: 16px;
  padding-right: 16px;
}
ion-menu.ios ion-note {
  margin-bottom: 8px;
}
ion-note {
  display: inline-block;
  font-size: 16px;
  color: var(--ion-color-medium-shade);
}
ion-item.selected {
  --color: var(--ion-color-primary);
}
ion-split-pane {
  --side-width: 350px;
  --side-max-width: 350px;
  --border: 1px solid #b3baff;
}
.version {
  margin-bottom: var(--ion-safe-area-bottom, 0);
  text-align: center;
  padding: 5px 0;
}
</style>
