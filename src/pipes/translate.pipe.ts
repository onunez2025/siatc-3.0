import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({
    name: 'translate',
    standalone: true,
    pure: false // Necessary because currentLang is a signal and we want the pipe to update when the signal changes
})
export class TranslatePipe implements PipeTransform {
    private langService = inject(LanguageService);

    transform(key: string): string {
        return this.langService.translate(key);
    }
}
