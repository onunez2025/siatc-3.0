import { Component, Input, Output, EventEmitter, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ViewDefinition, EntityDefinition, FormConfig } from '../../../core/schema/view-definitions';
import { TranslatePipe } from '../../../../pipes/translate.pipe';

@Component({
    selector: 'app-generic-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
    template: `
    <div class="flex flex-col h-full bg-slate-50">
      <!-- Header -->
      <div class="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center">
        <h2 class="text-xl font-bold text-slate-800">{{ view.name }}</h2>
        <button (click)="onCancel()" class="text-slate-500 hover:text-slate-800">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Form Content -->
      <div class="flex-1 overflow-y-auto p-6 custom-scroll">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl mx-auto">
            
            <div class="grid grid-cols-1 gap-6" [class.md:grid-cols-2]="config?.layout === 'two-column'">
                @for (field of entity.fields; track field.key) {
                    @if (!field.hidden && field.editable !== false) {
                        <div class="space-y-1 block" [class.col-span-2]="config?.layout === 'single-column'">
                            <label [for]="field.key" class="block text-sm font-medium text-slate-700">
                                {{ field.label }}
                                @if (field.required) { <span class="text-red-500">*</span> }
                            </label>

                            <!-- Text / Number / Email / Phone -->
                            @if (['text', 'number', 'email', 'phone'].includes(field.type)) {
                                <input 
                                    [type]="field.type === 'number' ? 'number' : 'text'" 
                                    [id]="field.key"
                                    [formControlName]="field.key"
                                    class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                                    [class.border-red-300]="isInvalid(field.key)"
                                >
                            }

                            <!-- TextArea -->
                            @if (field.type === 'textarea') {
                                <textarea
                                    [id]="field.key"
                                    [formControlName]="field.key"
                                    rows="3"
                                    class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none resize-none"
                                ></textarea>
                            }

                            <!-- Date -->
                            @if (field.type === 'date') {
                                <input 
                                    type="date" 
                                    [id]="field.key"
                                    [formControlName]="field.key"
                                    class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                                >
                            }

                            <!-- Enum / Select -->
                            @if (field.type === 'enum' && field.options) {
                                <select 
                                    [id]="field.key"
                                    [formControlName]="field.key"
                                    class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none bg-white"
                                >
                                    <option value="">{{ 'SELECT' | translate }}</option>
                                    @for (opt of field.options; track opt) {
                                        <option [value]="opt">{{ opt }}</option>
                                    }
                                </select>
                            }

                            <!-- Boolean -->
                            @if (field.type === 'boolean') {
                                <div class="flex items-center h-full pt-6">
                                    <input 
                                        type="checkbox" 
                                        [id]="field.key"
                                        [formControlName]="field.key"
                                        class="w-5 h-5 text-red-600 rounded border-slate-300 focus:ring-red-500"
                                    >
                                    <label [for]="field.key" class="ml-2 text-sm text-slate-700">{{ field.label }}</label>
                                </div>
                            }

                            @if (isInvalid(field.key)) {
                                <p class="text-xs text-red-500 mt-1">{{ 'FIELD_REQUIRED' | translate }}</p>
                            }
                        </div>
                    }
                }
            </div>

            <!-- Actions -->
            <div class="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button 
                    type="button" 
                    (click)="onCancel()"
                    class="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                    {{ 'CANCEL' | translate }}
                </button>
                <button 
                    type="submit" 
                    [disabled]="form.invalid || submitting()"
                    class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    @if (submitting()) {
                        <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    }
                    {{ 'SAVE' | translate }}
                </button>
            </div>
        </form>
      </div>
    </div>
  `,
    styles: []
})
export class GenericFormComponent {
    @Input({ required: true }) view!: ViewDefinition;
    @Input({ required: true }) entity!: EntityDefinition;
    @Input() data: any = null; // If editing
    @Output() save = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();

    config!: FormConfig;
    form!: FormGroup;
    submitting = signal(false);

    constructor(private fb: FormBuilder) {
        effect(() => {
            if (this.view && this.entity) {
                this.config = this.view.config as FormConfig;
                this.initForm();
            }
        });
    }

    initForm() {
        const group: any = {};
        this.entity.fields.forEach(field => {
            if (!field.hidden && field.editable !== false) {
                const validators = field.required ? [Validators.required] : [];
                const val = this.data ? this.data[field.key] : '';
                group[field.key] = [val, validators];
            }
        });
        this.form = this.fb.group(group);
    }

    isInvalid(key: string): boolean {
        const ctrl = this.form.get(key);
        return ctrl ? (ctrl.invalid && (ctrl.dirty || ctrl.touched)) : false;
    }

    onSubmit() {
        if (this.form.valid) {
            this.submitting.set(true);
            this.save.emit(this.form.value);
        } else {
            this.form.markAllAsTouched();
        }
    }

    onCancel() {
        this.cancel.emit();
    }
}
