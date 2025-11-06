// Base types for common fields
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

// Inspection types
export interface Inspection extends BaseEntity {
  client_id: string;
  contact_person: string;
  supplier_book: string;
  supplier_id: number;
  supplier_contact_id: number;
  factory: number;
  factory_contact_person: number;
  factory_contact_person2: string;
  inspector_id: number;
  secondary_inspector_id: string | null;
  old_inspector_id: number | null;
  manday: number;
  note: string;
  template_id: number;
  word_template: string | null;
  online_template: string;
  inspection_date: string;
  review_date: string | null;
  inspection_date_to: string;
  shipment_date: string | null;
  factory_change_date: string | null;
  service: string;
  percentageFriSpk: number | null;
  sub_service: string | null;
  reference_number: string;
  mrn_no: string | null;
  client_project_number: string;
  supplier_name: string;
  client_name: string | null;
  com_name: string | null;
  comp_addr: string | null;
  comp_other_info: string | null;
  sera_client_name: string;
  number_of_reports: number;
  client_requirement: string | null;
  client_memo: string | null;
  requirement: string;
  memo: string;
  status: number;
  Clientstatus: number;
  inspection_status: string;
  reason_for_cancellation: string | null;
  report_status: string | null;
  client_book: string | null;
  client_book_id: number | null;
  project_type: string;
  urgent: string;
  report_type: string | null;
  inspection_type: string | null;
  report_comments: string | null;
  complex_report: number;
  attachment: string | null;
  combine_aql: string;
  reviewed_by: string | null;
  created_by: number;
  fm_id: number;
  filename: string | null;
}

// Report types
export interface Report extends BaseEntity {
  inspection_id: number;
  client_code: string;
  service: string;
  inspection_date: string;
  report_no: string;
  password: string;
  inspector_id: number;
}

// Client types
export interface Client extends BaseEntity {
  user_id: number;
  client_code: string;
  client_name: string;
  username: string | null;
  password: string | null;
  string_password: string | null;
  email: string | null;
  Company_Name: string;
  Company_Website: string;
  Company_Email: string;
  Company_Address: string;
  company_country_name: string;
  company_country_id: string;
  company_state_name: string | null;
  company_state_id: string;
  company_city_name: string;
  company_city_id: string;
  company_bldg_num: string;
  company_street_num: string;
  company_house_num: string;
  company_zip_code: string;
  company_invoice_country_name: string;
  company_invoice_country_id: string;
  company_invoice_state_name: string | null;
  company_invoice_state_id: string | null;
  company_invoice_city_name: string;
  company_invoice_city_id: string | null;
  company_inv_bldg_num: string;
  company_inv_street_num: string;
  company_inv_house_num: string;
  company_inv_zip_code: string;
  Invoice_Address: string | null;
  Phone_number: string;
  payment_term: string;
  notice: string;
  special_term: string | null;
  sales_id: number;
  book_id: number;
  book_id_outside: number;
  related_by: string;
  others: string;
  remember_token: string | null;
  client_status: string | null;
  status: string;
  added_by: string | null;
  client_type: string | null;
  contact_already: string;
  email_attachment: string;
  contact_date: string | null;
  latest_inspection_date: string;
  inspection_frequency: number;
  next_expected_inspection_date: string;
  activity_status: string;
}

// Client contact types
export interface ClientContact extends BaseEntity {
  client_code: string;
  contact_title: string;
  contact_person: string;
  position: string;
  contact_number: string;
  tel_number: string;
  email_address: string;
  client_skype: string;
  client_wechat: string;
  client_whatsapp: string;
  client_qqmail: string;
  client_contact_status: number;
  report_notify: number;
}

// Inspector types
export interface Inspector extends BaseEntity {
  user_id: number;
  name: string;
  user_gender: string | null;
  email_address: string;
  contact_number: string;
  tel_number: string;
  user_skype: string;
  user_wechat: string;
  user_whatsapp: string;
  user_qqmail: string;
  address: string;
  user_country_name: string;
  user_country_id: number;
  user_state_name: string;
  user_state_id: string;
  user_city_name: string;
  user_city_id: string;
  designation: string;
  groupDesignation: string | null;
  client_code: string | null;
  photo: string;
  status: number;
}

// Factory types
export interface Factory extends BaseEntity {
  client_code: string | null;
  supplier_id: number;
  factory_name: string;
  factory_number: string;
  factory_address: string;
  factory_address_local: string;
  factory_city_local: string;
  factory_country: string;
  factory_country_name: string;
  factory_state: string;
  factory_state_id: string;
  factory_city: string;
  factory_city_id: string;
  factory_status: number;
  added_by: string | null;
}

// Factory contact types
export interface FactoryContact extends BaseEntity {
  factory_id: number;
  client_code: string | null;
  factory_contact_title: string;
  factory_contact_person: string;
  position: string;
  factory_contact_number: string;
  factory_tel_number: string;
  factory_email: string;
  factory_contact_skype: string;
  factory_contact_wechat: string;
  factory_contact_whatsapp: string;
  factory_contact_qq: string;
  factory_contact_status: number;
}

// Product types
export interface Product extends BaseEntity {
  inspection_id: number;
  product_number: string | null;
  product_id: string | null;
  product_name: string;
  product_first_category: string;
  product_category: string;
  product_unit: string;
  product_unit_other: string;
  brand: string;
  po_no: string;
  model_no: string;
  mrn_no: string;
  supplier_item_no: string | null;
  cmf: string | null;
  tech_specs: string | null;
  shipping_mark: string | null;
  additional_product_info: string;
  inspection_standard: string;
  product_length: number | null;
  product_width: number | null;
  product_height: number | null;
  product_diameter: number | null;
  product_weight: number | null;
  retail_length: number | null;
  retail_width: number | null;
  retail_height: number | null;
  retail_diameter: number | null;
  retail_weight: number | null;
  retail_box_qty: number | null;
  inner_length: number | null;
  inner_width: number | null;
  inner_height: number | null;
  inner_diameter: number | null;
  inner_weight: number | null;
  inner_box_qty: number | null;
  export_length: number | null;
  export_width: number | null;
  export_height: number | null;
  export_diameter: number | null;
  export_weight: number | null;
  export_box_qty: number | null;
  export_max_weight_carton: number | null;
  export_cbm: number | null;
  grd: string | null;
  item_description: string | null;
  aql_qty: number;
  aql_qty_unit: string;
  aql_qty_unit_other: string;
  total_aql_qty: number | null;
  aql_normal_level: string;
  aql_special_level: string;
  aql_major: string;
  max_allowed_major: string;
  aql_minor: string;
  max_allowed_minor: string;
  aql_normal_letter: string;
  aql_normal_sampsize: string;
  aql_special_letter: string;
  aql_special_sampsize: string;
  total_aql_sampsize: number | null;
  full_check: string;
}

// Supplier types
export interface Supplier extends BaseEntity {
  client_code: string;
  supplier_name: string;
  supplier_number: string;
  supplier_code: string;
  supplier_address: string;
  supplier_address_local: string;
  supplier_local_address: string;
  supplier_local_city: string;
  supplier_country: string;
  supplier_country_name: string;
  supplier_state: string | null;
  supplier_state_id: string | null;
  supplier_city: string;
  supplier_city_id: string | null;
  supplier_status: number;
  added_by: string;
}

// Supplier contact types
export interface SupplierContact extends BaseEntity {
  supplier_id: number;
  client_code: string;
  supplier_contact_title: string | null;
  supplier_contact_person: string;
  position: string | null;
  supplier_contact_number: string;
  supplier_tel_number: string;
  supplier_email: string;
  supplier_contact_skype: string;
  supplier_contact_wechat: string;
  supplier_contact_whatsapp: string;
  supplier_contact_qq: string;
  supplier_contact_status: number;
  supplier_contact_phone: string;
}

// Form item types
export interface FormItemOption {
  option: string;
  condition: boolean;
  field: string;
}

export interface FormItem {
  key: string;
  label: string | null;
  component: string;
  field?: string | null;
  options?:
    | string
    | FormItemOption[]
    | {
        editable: boolean;
        portrait: boolean;
      }
    | null;
}

export interface FormSection {
  key: string;
  title: string;
  data: {
    items: FormItem[];
  };
}

// Main download data type
export interface DownloadData {
  inspection: Inspection;
  report: Report;
  client: Client;
  client_contact: ClientContact;
  inspector: Inspector;
  factory: Factory;
  factory_contact: FactoryContact;
  products: Product[];
  items: FormSection[];
  supplier: Supplier;
  supplier_contact: SupplierContact;
  downloadTime?: number;
  startTime?: string;
}

// API response type
export interface DownloadResponse {
  success: boolean;
  data: DownloadData;
  message?: string;
}

// Download function parameters
export interface DownloadParams {
  reportId: string;
  password: string;
}

export interface ComponentProps {
  id: string;
  parent?: string;
  label?: string;
  field?: string;
  value?: string;
  options?: any;
}

export interface Picture {
  type: string;
  label: string;
  value: string;
  remark?: string;
}

export interface Remark {
  type: string;
  label: string;
  value: string;
}
