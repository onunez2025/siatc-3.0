import { EntityDefinition, ViewDefinition } from '../schema/view-definitions';

export const USER_ENTITY: EntityDefinition = {
    name: 'users',
    label: 'Usuarios',
    idField: 'id',
    labelField: 'name',
    fields: [
        { key: 'id', label: 'ID', type: 'text', hidden: true },
        { key: 'username', label: 'Usuario', type: 'text', required: true },
        { key: 'name', label: 'Nombre Completo', type: 'text', required: true },
        { key: 'email', label: 'Correo Electrónico', type: 'email' },
        {
            key: 'role',
            label: 'Rol',
            type: 'enum',
            options: ['ADMIN', 'TECNICO', 'OPERADOR'],
            required: true
        },
        { key: 'companyName', label: 'Empresa (CAS)', type: 'text' },
        { key: 'fsmCode', label: 'Código FSM', type: 'text', hidden: true },
        { key: 'lastLogin', label: 'Último Acceso', type: 'datetime', editable: false }
    ]
};

export const USERS_TABLE_VIEW: ViewDefinition = {
    id: 'users_table',
    entity: 'users',
    type: 'table',
    name: 'Gestión de Usuarios',
    icon: 'fas fa-users',
    roles: ['ADMIN'],
    actions: [
        { id: 'create', label: 'Nuevo Usuario', type: 'create', icon: 'fas fa-plus' },
        { id: 'edit', label: 'Editar', type: 'update', icon: 'fas fa-edit' },
        { id: 'delete', label: 'Eliminar', type: 'delete', icon: 'fas fa-trash' }
    ],
    config: {
        columns: ['username', 'name', 'email', 'role', 'companyName', 'lastLogin'],
        sortable: true,
        filterable: true,
        pageSize: 10
    }
};

export const USERS_DECK_VIEW: ViewDefinition = {
    id: 'users_deck',
    entity: 'users',
    type: 'deck',
    name: 'Usuarios',
    roles: ['ADMIN'],
    actions: [
        { id: 'create', label: 'Nuevo', type: 'create', icon: 'fas fa-plus' },
        { id: 'edit', label: 'Editar', type: 'update', icon: 'fas fa-edit' }
    ],
    config: {
        titleField: 'name',
        subtitleField: 'email',
        statusField: 'role',
        imageField: '' // Could add avatar later
    }
};
