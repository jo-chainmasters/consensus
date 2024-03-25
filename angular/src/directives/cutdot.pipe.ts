import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cutdot',
  standalone: true,
})
export class CutdotPipe implements PipeTransform {
  transform(value: string, ...args: string[]): string {
    if (value.length > 0)
      return value.substring(0, 5) + '...' + value.substring(value.length - 5);
    return '';
  }
}
