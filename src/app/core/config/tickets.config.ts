import { EntityDefinition, ViewDefinition } from '../schema/view-definitions';

export const TICKET_ENTITY: EntityDefinition = {
    name: 'tickets',
    label: 'Tickets de Servicio',
    idField: 'Ticket',
    labelField: 'NombreCliente',
    fields: [
        { key: 'Ticket', label: 'Nro. Ticket', type: 'text', editable: false }, // PK通常不可编辑
        { key: 'Estado', label: 'Estado', type: 'enum', options: ['Pendiente', 'En Proceso', 'Finalizado', 'Cerrado', 'Cancelado'], required: true },
        { key: 'FechaVisita', label: 'Fecha Visita', type: 'datetime', required: true },

        // Cliente
        { key: 'NombreCliente', label: 'Cliente', type: 'text', required: true },
        { key: 'Distrito', label: 'Distrito', type: 'text' },
        { key: 'Direccion', label: 'Dirección', type: 'text' }, // Mapped from Calle + Numero

        // Técnico
        { key: 'NombreTecnico', label: 'Técnico', type: 'text' },

        // Ejecución (Lo que pidió el usuario editar)
        { key: 'VisitaRealizada', label: '¿Visita Realizada?', type: 'boolean' },
        { key: 'TrabajoRealizado', label: '¿Trabajo Realizado?', type: 'boolean' },
        { key: 'ComentarioTecnico', label: 'Comentarios del Técnico', type: 'textarea' },
        { key: 'SolicitaNuevaVisita', label: '¿Nueva Visita?', type: 'boolean' },
        { key: 'MotivoNuevaVisita', label: 'Motivo Nueva Visita', type: 'text' },

        // Info Adicional
        { key: 'TipoServicio', label: 'Tipo Servicio', type: 'text', editable: false },
        { key: 'NombreEquipo', label: 'Equipo', type: 'text', editable: false }
    ]
};

export const TICKETS_TABLE_VIEW: ViewDefinition = {
    id: 'tickets_table',
    entity: 'tickets',
    type: 'table',
    name: 'Gestión de Tickets',
    icon: 'fas fa-ticket-alt',
    roles: ['ADMIN', 'TECNICO', 'OPERADOR'],
    actions: [
        { id: 'edit', label: 'Editar', type: 'update', icon: 'fas fa-edit' },
        // { id: 'view', label: 'Ver Detalle', type: 'navigate', icon: 'fas fa-eye' } // Puede ser una acción personalizada
    ],
    config: {
        columns: ['Ticket', 'Estado', 'FechaVisita', 'NombreCliente', 'Distrito', 'NombreTecnico', 'VisitaRealizada'],
        sortable: true,
        filterable: true,
        pageSize: 10
    }
};

export const TICKETS_DECK_VIEW: ViewDefinition = {
    id: 'tickets_deck',
    entity: 'tickets',
    type: 'deck',
    name: 'Mis Tickets',
    roles: ['TECNICO', 'OPERADOR'],
    actions: [
        { id: 'edit', label: 'Editar', type: 'update', icon: 'fas fa-edit' }
    ],
    config: {
        titleField: 'NombreCliente',
        subtitleField: 'Ticket',
        statusField: 'Estado',
        imageField: ''
    }
};

export const TICKETS_FORM_VIEW: ViewDefinition = {
    id: 'tickets_form',
    entity: 'tickets',
    type: 'form',
    name: 'Editar Ticket',
    roles: ['ADMIN', 'TECNICO', 'OPERADOR'],
    actions: [],
    config: {
        layout: 'two-column'
    }
}
