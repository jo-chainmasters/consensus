import { Component, Input } from "@angular/core";
import { TableModule } from "primeng/table";

@Component({
  selector: 'app-prevotes',
  standalone: true,
  imports: [
    TableModule
  ],
  templateUrl: './prevotes.component.html',
  styleUrl: './prevotes.component.css'
})
export class PrevotesComponent {

  @Input()
  prevotes: any[] = [];


}
