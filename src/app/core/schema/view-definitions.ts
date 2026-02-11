export type ViewType = 'calendar' | 'deck' | 'table' | 'gallery' | 'detail' | 'map' | 'chart' | 'dashboard' | 'form' | 'onboarding' | 'card';
export type ActionType = 'create' | 'update' | 'delete' | 'navigate' | 'custom';
export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'boolean' | 'enum' | 'image' | 'ref' | 'email' | 'phone' | 'latlong';

export interface EntityDefinition {
    name: string;      // e.g., 'tickets'
    label: string;     // e.g., 'Tickets de Servicio'
    idField: string;   // e.g., 'Ticket'
    labelField: string; // Field to show in summaries, e.g., 'Asunto'
    fields: FieldDef[];
}

export interface FieldDef {
    key: string;       // e.g., 'NombreCliente'
    label: string;     // e.g., 'Cliente'
    type: FieldType;
    hidden?: boolean;
    required?: boolean;
    editable?: boolean;
    options?: string[]; // For enums
    refEntity?: string; // For 'ref' type
}

export interface ActionDef {
    id: string;
    label: string;
    icon: string;
    type: ActionType;
    handler?: (item: any) => void;
    roles?: string[];
}

export interface ViewDefinition {
    id: string;        // e.g., 'tickets_table_view'
    entity: string;    // 'tickets'
    type: ViewType;
    name: string;      // 'Todos los Tickets'
    icon?: string;
    config: ViewConfig;
    actions: ActionDef[];
    roles: string[];   // ['ADMIN', 'TECNICO']
}

export interface ViewConfig {
    [key: string]: any;
}

export interface TableConfig extends ViewConfig {
    columns: string[];
    sortable?: boolean;
    filterable?: boolean;
    pageSize?: number;
}

export interface DeckConfig extends ViewConfig {
    titleField: string;
    subtitleField: string;
    imageField?: string;
    statusField?: string;
}

export interface FormConfig extends ViewConfig {
    layout: 'single-column' | 'two-column';

}
