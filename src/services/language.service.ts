import { Injectable, signal, computed } from '@angular/core';

export type Language = 'es' | 'en';

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    currentLang = signal<Language>('es');

    private translations: Record<Language, Record<string, string>> = {
        es: {
            DASHBOARD: 'Dashboard',
            TICKETS: 'Tickets',
            USERS: 'Usuarios',
            LOGOUT: 'Cerrar Sesión',
            WELCOME: 'Bienvenido',
            LAST_UPDATE: 'Última actualización',
            DB_STATUS: 'Base de datos: Conectado',
            SELECT_LANG: 'Seleccionar Idioma',

            // Login
            WELCOME_BACK: 'Bienvenido',
            LOGIN_SUBTITLE: 'Sistema Integrado de Atención Técnica al Cliente (SIATC)',
            USERNAME: 'Usuario',
            PASSWORD: 'Contraseña',
            ENTER_USER: 'Ingrese su usuario',
            REMEMBER_ME: 'Recordarme',
            FORGOT_PASS: '¿Olvidó su contraseña?',
            LOGIN_BTN: 'Iniciar Sesión',
            AUTH_ERROR_TITLE: 'Error de autenticación',
            AUTH_ERROR_MSG: 'Usuario o contraseña incorrectos.',
            RIGHTS_RESERVED: 'Todos los derechos reservados.',

            // Dashboard
            STATS_TOTAL: 'Total',
            STATS_PENDING: 'Pendiente',
            STATS_IN_PROGRESS: 'En Proceso',
            STATS_COMPLETED: 'Finalizado',
            STATS_REGISTERED: 'Servicios Registrados',
            STATS_NOT_STARTED: 'Sin iniciar',
            STATS_EXECUTING: 'Actualmente ejecutando',
            STATS_FINISHED: 'Servicios completados',
            STATS_TODAY: 'Servicios de Hoy',
            OTRAS_ACCIONES: 'Otras Acciones',

            // Standardized Statuses
            STATUS_CLOSED: 'Cerrado',
            STATUS_REJECTED: 'Rechazado por service',
            STATUS_CANCELLED: 'Cancelado',
            STATUS_REPROGRAMMED: 'Reprogramado',
            STATUS_READY: 'Listo para planificar',

            RECENT_TICKETS: 'Tickets Recientes',
            VIEW_ALL: 'Ver Todo',

            // Ticket List
            SERVICE_TYPE: 'Tipo de Servicio',
            SEARCH_PLACEHOLDER: 'Buscar por cliente, técnico o código...',
            SHOW: 'Mostrar',
            EXPORT: 'Exportar',
            NEW_TICKET: 'Nuevo Ticket',
            COLUMNS: 'Columnas',
            ID_TICKET: 'ID Ticket',
            STATUS: 'Estado',
            CLIENT: 'Cliente',
            VISIT_DATE: 'Fecha Visita',
            DISTRICT: 'Distrito',
            EMAIL: 'Email',
            CITY: 'Ciudad',
            TECHNICIAN: 'Técnico',
            ACTIONS: 'Acciones',

            // Ticket Form
            EDIT_TICKET: 'Editar Ticket',
            NEW_TICKET_TITLE: 'Nuevo Ticket',
            EDIT_TICKET_MSG: 'Actualice la información del servicio técnico.',
            NEW_TICKET_MSG: 'Complete los datos para registrar un nuevo servicio.',
            TICKET_INFO: 'Información del Ticket',
            CLIENT_DATA: 'Datos del Cliente',
            EQUIPMENT_TECH: 'Producto y Técnico',
            COMMENTS: 'Comentarios',
            SAVE_CHANGES: 'Guardar Cambios',
            SAVING: 'Guardando...',

            // Dashboard Analytics
            STATUS_DISTRIBUTION: 'Distribución por Estado',
            TOP_SERVICE_TYPES: 'Tipos de Servicio (Top 5)',
            NO_DATA_TODAY: 'No hay datos suficientes para mostrar gráficos hoy.',
            SERVICE_CATEGORY: 'Categoría de Servicio',
            COUNT: 'Cantidad',

            // Ticket Detail
            TICKET_DETAIL: 'Detalle del Ticket',
            MODIFIED: 'Modificado',
            LOCATION: 'Ubicación',
            ADDRESS: 'Dirección',
            ZONA_CITY: 'Zona / Ciudad',
            REFERENCE: 'Referencia',
            NO_REFERENCE: 'Sin referencia',
            EQUIPMENT: 'Equipo',
            PRODUCT: 'Producto',
            EXTERNAL_CODE: 'Código Externo',
            INTERNAL_ID: 'ID Interno',
            EXECUTION: 'EJECUCIÓN DEL SERVICIO',
            VISIT_MADE: 'Visita Realizada',
            WORK_MADE: 'Trabajo Realizado',
            NEW_VISIT: '¿Nueva Visita?',
            REASON_NEW_VISIT: 'Motivo Nueva Visita',
            PROG_COMMENT: 'Comentario Programador',
            TECH_COMMENT: 'Comentario Técnico',
            NONE: 'Ninguno',
            EXPORT_PDF: 'Exportar PDF',
            NAME: 'Nombre',
            CLIENT_ID: 'ID Cliente',
            CELLPHONE: 'Celular',
            PHONE: 'Teléfono',
            EQUIPMENT_NAME: 'Nombre del Equipo',
            TECH_CODE: 'Cód. Técnico',
            TECH_NAME: 'Nombre Técnico',
            TECH_SURNAME: 'Apellido Técnico',

            // User Management
            USER_MGMT: 'Gestión de Usuarios',
            USER_MGMT_SUB: 'Administra el acceso a la plataforma.',
            NEW_USER: 'Nuevo Usuario',
            REG_NEW_USER: 'Registrar Nuevo Usuario',
            FULL_NAME: 'Nombre Completo',
            USERNAME_LOGIN: 'Usuario (Login)',
            ROLE: 'Rol',
            LAST_ACCESS: 'Último Acceso',
            DELETE: 'Eliminar',
            CONFIRM_DELETE_USER: '¿Estás seguro de eliminar a {name}?',
            NEVER: 'Nunca',

            // Generic
            CLOSE: 'Cerrar',
            SAVE: 'Guardar',
            CANCEL: 'Cancelar',
            CONFIRM_DELETE: '¿Estás seguro de eliminar este elemento?',
            NO_RESULTS: 'No se encontraron resultados'
        },
        en: {
            DASHBOARD: 'Dashboard',
            TICKETS: 'Tickets',
            USERS: 'Users',
            LOGOUT: 'Logout',
            WELCOME: 'Welcome',
            LAST_UPDATE: 'Last Update',
            DB_STATUS: 'Database: Connected',
            SELECT_LANG: 'Select Language',

            // Login
            WELCOME_BACK: 'Welcome',
            LOGIN_SUBTITLE: 'Integrated Technical Customer Service System (SIATC)',
            USERNAME: 'Username',
            PASSWORD: 'Password',
            ENTER_USER: 'Enter your username',
            REMEMBER_ME: 'Remember me',
            FORGOT_PASS: 'Forgot your password?',
            LOGIN_BTN: 'Login',
            AUTH_ERROR_TITLE: 'Authentication Error',
            AUTH_ERROR_MSG: 'Incorrect username or password.',
            RIGHTS_RESERVED: 'All rights reserved.',

            // Dashboard
            STATS_TOTAL: 'Total',
            STATS_PENDING: 'Pending',
            STATS_IN_PROGRESS: 'In Progress',
            STATS_COMPLETED: 'Completed',
            STATS_REGISTERED: 'Registered Services',
            STATS_NOT_STARTED: 'Not started',
            STATS_EXECUTING: 'Currently executing',
            STATS_FINISHED: 'Completed services',
            STATS_TODAY: "Today's Services",
            OTRAS_ACCIONES: 'Otras Acciones',

            // Cancellations
            CANCEL_SERVICE: 'Cancelar Servicio',
            CANCEL_REASON: 'Motivo de Cancelación',
            AUTHORIZER: 'Autorizador',
            CANCELLATION_INFO: 'Información de Cancelación',
            CANCEL_PROMPT: 'Por favor, ingrese el motivo y quién autoriza la cancelación.',
            CONFIRM_CANCEL: 'Confirmar Cancelación',

            // Standardized Statuses
            STATUS_CLOSED: 'Closed',
            STATUS_REJECTED: 'Rejected by service',
            STATUS_CANCELLED: 'Cancelled',
            STATUS_REPROGRAMMED: 'Reprogrammed',
            STATUS_READY: 'Ready to plan',

            RECENT_TICKETS: 'Recent Tickets',
            VIEW_ALL: 'View All',

            // Dashboard Analytics
            STATUS_DISTRIBUTION: 'Status Distribution',
            TOP_SERVICE_TYPES: 'Service Types (Top 5)',
            NO_DATA_TODAY: 'No sufficient data to display charts today.',
            SERVICE_CATEGORY: 'Service Category',
            COUNT: 'Count',

            // Ticket List
            SERVICE_TYPE: 'Service Type',
            SEARCH_PLACEHOLDER: 'Search by client, technician or code...',
            SHOW: 'Show',
            EXPORT: 'Export',
            NEW_TICKET: 'New Ticket',
            COLUMNS: 'Columns',
            ID_TICKET: 'Ticket ID',
            STATUS: 'Status',
            CLIENT: 'Client',
            VISIT_DATE: 'Visit Date',
            TECHNICIAN: 'Technician',
            ACTIONS: 'Actions',

            // Ticket Form
            EDIT_TICKET: 'Edit Ticket',
            NEW_TICKET_TITLE: 'New Ticket',
            EDIT_TICKET_MSG: 'Update the technical service information.',
            NEW_TICKET_MSG: 'Complete the data to register a new service.',
            TICKET_INFO: 'Ticket Information',
            CLIENT_DATA: 'Client Data',
            EQUIPMENT_TECH: 'Product and Technician',
            COMMENTS: 'Comments',
            SAVE_CHANGES: 'Save Changes',
            SAVING: 'Saving...',

            // Ticket Detail
            TICKET_DETAIL: 'Ticket Detail',
            MODIFIED: 'Modified',
            LOCATION: 'Location',
            ADDRESS: 'Address',
            ZONA_CITY: 'Zone / City',
            REFERENCE: 'Reference',
            NO_REFERENCE: 'No reference',
            EQUIPMENT: 'Equipment',
            PRODUCT: 'Product',
            EXTERNAL_CODE: 'External Code',
            INTERNAL_ID: 'Internal ID',
            EXECUTION: 'SERVICE EXECUTION',
            VISIT_MADE: 'Visit Made',
            WORK_MADE: 'Work Made',
            NEW_VISIT: 'New Visit?',
            REASON_NEW_VISIT: 'New Visit Reason',
            PROG_COMMENT: 'Programmer Comment',
            TECH_COMMENT: 'Technician Comment',
            NONE: 'None',
            EXPORT_PDF: 'Export PDF',
            NAME: 'Name',
            CLIENT_ID: 'Client ID',
            EMAIL: 'Email',
            CELLPHONE: 'Cellphone',
            PHONE: 'Phone',
            DISTRICT: 'District',
            CITY: 'City',
            EQUIPMENT_NAME: 'Equipment Name',
            TECH_CODE: 'Tech Code',
            TECH_NAME: 'Tech Name',
            TECH_SURNAME: 'Tech Surname',

            // User Management
            USER_MGMT: 'User Management',
            USER_MGMT_SUB: 'Manage platform access.',
            NEW_USER: 'New User',
            REG_NEW_USER: 'Register New User',
            FULL_NAME: 'Full Name',
            USERNAME_LOGIN: 'Username (Login)',
            ROLE: 'Role',
            LAST_ACCESS: 'Last Access',
            DELETE: 'Delete',
            CONFIRM_DELETE_USER: 'Are you sure you want to delete {name}?',
            NEVER: 'Never',

            // Generic
            CLOSE: 'Close',
            SAVE: 'Save',
            CANCEL: 'Cancel',
            CONFIRM_DELETE: 'Are you sure you want to delete this item?',
            NO_RESULTS: 'No results found'
        }
    };

    translate(key: string): string {
        const lang = this.currentLang();
        return this.translations[lang][key] || key;
    }

    setLanguage(lang: Language) {
        this.currentLang.set(lang);
    }
}
