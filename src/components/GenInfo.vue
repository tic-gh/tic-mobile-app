<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { IonGrid, IonRow, IonCol, IonInput } from '@ionic/vue';
import { useStorage } from '@/composables/useStorage';
import { useDebounce } from '@/composables/useDebounce';

interface ComponentProps {
  parent: string;
  id: string;
  label: string | null;
  field: string | null;
  value?: string;
  options?: string;
  download?: DownloadData;
}

// Define the download object structure
interface DownloadData {
  supplier_contact?: {
    supplier_contact_person?: string;
    supplier_contact_phone?: string;
    supplier_email?: string;
  };
  supplier?: {
    supplier_code?: string;
    supplier_address?: string;
    supplier_number?: string;
    supplier_address_local?: string;
  };
  factory?: {
    factory_address_local?: string;
    factory_address?: string;
    factory_name?: string;
  };
  inspection?: {
    service?: string;
    reference_number?: string;
    inspection_date?: string;
    supplier_name?: string;
    requirement?: string;
  };
  client?: {
    client_name?: string;
    Company_Name?: string;
  };
  client_contact?: {
    contact_person?: string;
    contact_number?: string;
    email_address?: string;
  };
  inspector?: {
    name?: string;
    email_address?: string;
  };
  factory_contact?: {
    factory_contact_person?: string;
    factory_contact_number?: string;
    factory_email?: string;
  };
  products?: Array<{
    product_name?: string;
    brand?: string;
    po_no?: string;
    model_no?: string;
    aql_qty?: string | number;
    product_width?: string | number;
    aql_qty_unit?: string;
    aql_major?: string | number;
    aql_minor?: string | number;
    aql_normal_letter?: string;
    aql_normal_level?: string | number;
    aql_normal_sampsize?: string | number;
    aql_special_letter?: string;
    aql_special_level?: string | number;
    aql_special_sampsize?: string | number;
    max_allowed_major?: string | number;
    max_allowed_minor?: string | number;
    product_length?: string | number;
    product_height?: string | number;
    product_diameter?: string | number;
    product_weight?: string | number;
    inner_box_qty?: string | number;
    export_box_qty?: string | number;
    export_length?: string | number;
    export_width?: string | number;
    export_height?: string | number;
    export_cbm?: string | number;
    grd?: string | number;
    export_weight?: string | number;
    item_description?: string;
  }>;
}

const props = defineProps<ComponentProps>();

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const data = ref();

// Simple date formatting function to replace datePipe
const formatDate = (dateString: string | undefined, format: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (format === 'longDate') {
    return monthNames[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
  }
  return dateString;
};

const processGenInfo = () => {
  switch (props.field) {
    case 'date_now': {
      const t = new Date();
      data.value = monthNames[t.getMonth()] + ' ' + t.getDate() + ', ' + t.getFullYear();
      break;
    }
    case 'supplier_contact_person':
      data.value = props.download?.supplier_contact?.supplier_contact_person;
      break;
    case 'supplier_contact_phone':
      data.value = props.download?.supplier_contact?.supplier_contact_phone;
      break;
    case 'supplier_email':
      data.value = props.download?.supplier_contact?.supplier_email;
      break;
    case 'supplier_code':
      data.value = props.download?.supplier?.supplier_code;
      break;
    case 'supplier_address':
      data.value = props.download?.supplier?.supplier_address;
      break;
    case 'supplier_item_number':
      data.value = props.download?.supplier?.supplier_number;
      break;
    case 'supplier_address_local':
      data.value = props.download?.supplier?.supplier_address_local;
      break;
    case 'factory_address_local':
      data.value = props.download?.factory?.factory_address_local;
      break;
    case 'service':
      data.value = props.download?.inspection?.service;
      break;
    case 'report-number':
      data.value = props.download?.inspection?.reference_number;
      break;
    case 'inspection-date':
      data.value = formatDate(props.download?.inspection?.inspection_date, 'longDate');
      break;
    case 'place-of-inspection':
      data.value = props.download?.factory?.factory_address;
      break;
    case 'client-name':
      data.value = props.download?.client?.client_name;
      break;
    case 'company-name':
      data.value = props.download?.client?.Company_Name;
      break;
    case 'supplier-name':
      data.value = props.download?.inspection?.supplier_name;
      break;
    case 'contact_person':
      data.value = props.download?.client_contact?.contact_person;
      break;
    case 'contact_number':
      data.value = props.download?.client_contact?.contact_number;
      break;
    case 'contact_email':
      data.value = props.download?.client_contact?.email_address;
      break;
    case 'inspector_assigned':
      data.value = props.download?.inspector?.name;
      break;
    case 'inspector_address':
      data.value = props.download?.inspector?.email_address;
      break;
    case 'factory-name':
      data.value = props.download?.factory?.factory_name;
      break;
    case 'factory-address':
      data.value = props.download?.factory?.factory_address;
      break;
    case 'factory-contact-person':
      data.value = props.download?.factory_contact?.factory_contact_person;
      break;
    case 'factory-contact-number':
      data.value = props.download?.factory_contact?.factory_contact_number;
      break;
    case 'factory-email':
      data.value = props.download?.factory_contact?.factory_email;
      break;
    case 'product-name':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.product_name;
        });
      } else {
        data.value = props.download?.products?.[0]?.product_name;
      }
      break;
    case 'product-brand':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.brand;
        });
      } else {
        data.value = props.download?.products?.[0]?.brand;
      }
      break;
    case 'product-po-number':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.po_no;
        });
      } else {
        data.value = props.download?.products?.[0]?.po_no;
      }
      break;
    case 'product-model-number':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.model_no;
        });
      } else {
        data.value = props.download?.products?.[0]?.model_no;
      }
      break;
    case 'product-quantity':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.aql_qty;
        });
      } else {
        data.value = props.download?.products?.[0]?.aql_qty;
      }
      break;
    case 'product_width':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.product_width;
        });
      } else {
        data.value = props.download?.products?.[0]?.product_width;
      }
      break;
    case 'product-unit':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = ' ' + key.aql_qty_unit;
        });
      } else {
        data.value = ' ' + props.download?.products?.[0]?.aql_qty_unit;
      }
      break;
    case 'product-requirement':
      data.value = props.download?.inspection?.requirement;
      break;
    case 'aql_major':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.aql_major;
        });
      } else {
        data.value = props.download?.products?.[0]?.aql_major;
      }
      break;
    case 'aql_minor':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.aql_minor;
        });
      } else {
        data.value = props.download?.products?.[0]?.aql_minor;
      }
      break;
    case 'aql_normal_letter':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.aql_normal_letter;
        });
      } else {
        data.value = props.download?.products?.[0]?.aql_normal_letter;
      }
      break;
    case 'aql_normal_level':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.aql_normal_level;
        });
      } else {
        data.value = props.download?.products?.[0]?.aql_normal_level;
      }
      break;
    case 'aql_normal_sampsize':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.aql_normal_sampsize;
        });
      } else {
        data.value = props.download?.products?.[0]?.aql_normal_sampsize;
      }
      break;
    case 'aql_qty':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.aql_qty;
        });
      } else {
        data.value = props.download?.products?.[0]?.aql_qty;
      }
      break;
    case 'aql_special_letter':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.aql_special_letter;
        });
      } else {
        data.value = props.download?.products?.[0]?.aql_special_letter;
      }
      break;
    case 'aql_special_level':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.aql_special_level;
        });
      } else {
        data.value = props.download?.products?.[0]?.aql_special_level;
      }
      break;
    case 'aql_special_sampsize':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.aql_special_sampsize;
        });
      } else {
        data.value = props.download?.products?.[0]?.aql_special_sampsize;
      }
      break;
    case 'max_allowed_major':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.max_allowed_major;
        });
      } else {
        data.value = props.download?.products?.[0]?.max_allowed_major;
      }
      break;
    case 'max_allowed_minor':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.max_allowed_minor;
        });
      } else {
        data.value = props.download?.products?.[0]?.max_allowed_minor;
      }
      break;
    case 'product_length':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.product_length;
        });
      } else {
        data.value = props.download?.products?.[0]?.product_length;
      }
      break;
    case 'product_height':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.product_height;
        });
      } else {
        data.value = props.download?.products?.[0]?.product_height;
      }
      break;
    case 'product_diameter':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.product_diameter;
        });
      } else {
        data.value = props.download?.products?.[0]?.product_diameter;
      }
      break;
    case 'product_weight':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.product_weight;
        });
      } else {
        data.value = props.download?.products?.[0]?.product_weight;
      }
      break;
    case 'inner_box_qty':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.inner_box_qty;
        });
      } else {
        data.value = props.download?.products?.[0]?.inner_box_qty;
      }
      break;
    case 'outer_box_qty':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.export_box_qty;
        });
      } else {
        data.value = props.download?.products?.[0]?.export_box_qty;
      }
      break;
    case 'carton_length':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.export_length;
        });
      } else {
        data.value = props.download?.products?.[0]?.export_length;
      }
      break;
    case 'carton_width':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.export_width;
        });
      } else {
        data.value = props.download?.products?.[0]?.export_width;
      }
      break;
    case 'carton_height':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.export_height;
        });
      } else {
        data.value = props.download?.products?.[0]?.export_height;
      }
      break;
    case 'carton_CBM':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.export_cbm;
        });
      } else {
        data.value = props.download?.products?.[0]?.export_cbm;
      }
      break;
    case 'carton_GRD':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.grd;
        });
      } else {
        data.value = props.download?.products?.[0]?.grd;
      }
      break;
    case 'carton_weight':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.export_weight;
        });
      } else {
        data.value = props.download?.products?.[0]?.export_weight;
      }
      break;
    case 'item_description':
      if (props.download?.products && props.download.products.length > 1) {
        data.value = [];
        props.download.products.forEach((key: any, index: number) => {
          data.value[index] = key.item_description;
        });
      } else {
        data.value = props.download?.products?.[0]?.item_description;
      }
      break;
    default:
      data.value = props.field ?? null;
  }
  saveData().catch((error) => {
    console.error('Error in processGenInfo:', error);
  });
};

const isArray = (value: any): boolean => {
  return Array.isArray(value);
};

// Use the storage composable
const { storageSetJson } = useStorage();

// Use the debounce composable
const { debounce } = useDebounce(300);

const saveData = async () => {
  try {
    await storageSetJson(props.id, {
      type: 'gen-info',
      value: data.value,
    });
  } catch (error) {
    console.error('Error saving data to storage:', error);
  }
};

// Create debounced version of saveData
const debouncedSaveData = debounce(saveData);

// Initialize data when component mounts
onMounted(() => {
  processGenInfo();
});

const isComplete = computed(() => {
  // If it's an array, check if it has at least one non-empty item
  if (Array.isArray(data.value)) {
    return data.value.length > 0 && data.value.some((item) => item != null && item !== '');
  }

  // For single values, only check for empty string if editable
  if (props.options === 'editable') {
    return data.value !== '' && data.value != null;
  }

  // For non-editable fields, just check if data exists
  return true;
});

defineExpose({
  isComplete,
});
</script>

<template>
  <ion-grid class="gen-info border ion-margin-bottom">
    <ion-row>
      <ion-col>{{ label }}:</ion-col>
    </ion-row>
    <ion-row class="content" v-if="!isArray(data) && options !== 'editable' && data != null">
      <ion-col>
        {{ data }}
      </ion-col>
    </ion-row>
    <ion-row class="content" v-if="isArray(data)">
      <ion-col>
        <div v-for="v in data" :key="v">{{ v }}</div>
      </ion-col>
    </ion-row>
    <ion-row v-if="!isArray(data) && options === 'editable' && data != null">
      <ion-col class="form-input">
        <ion-input
          type="text"
          v-model="data"
          @ionChange="debouncedSaveData"
          autocomplete="on"
          autocorrect="on"
          autocapitalize="on"
          :spellcheck="true"
          fill="solid">
        </ion-input>
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<style lang="css" scoped>
.border {
  border-bottom: 2px solid #ccc;
}
.content {
  background-color: #efefef;
  padding-left: 5px;
  border-radius: 5px;
}
</style>
