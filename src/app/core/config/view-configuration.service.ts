import { Injectable, signal } from '@angular/core';
import { ViewDefinition, EntityDefinition } from '../schema/view-definitions';

@Injectable({
    providedIn: 'root'
})
export class ViewConfigurationService {

    // Store all view definitions
    private views = signal<Map<string, ViewDefinition>>(new Map());
    private entities = signal<Map<string, EntityDefinition>>(new Map());

    constructor() { }

    registerView(view: ViewDefinition) {
        this.views.update(map => {
            const newMap = new Map(map);
            newMap.set(view.id, view);
            return newMap;
        });
    }

    registerEntity(entity: EntityDefinition) {
        this.entities.update(map => {
            const newMap = new Map(map);
            newMap.set(entity.name, entity);
            return newMap;
        });
    }

    getView(viewId: string): ViewDefinition | undefined {
        return this.views().get(viewId);
    }

    getEntity(entityName: string): EntityDefinition | undefined {
        return this.entities().get(entityName);
    }

    // Get views available for a specific role
    getViewsForRole(role: string): ViewDefinition[] {
        return Array.from(this.views().values()).filter(v =>
            v.roles.includes(role) || v.roles.includes('ALL')
        );
    }
}
