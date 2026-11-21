import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet, IonModal, IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline, checkmarkCircleOutline, informationCircleOutline } from 'ionicons/icons';
import { AppDialogService } from './services/app-dialog.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, IonModal, IonButton, IonIcon],
})
export class AppComponent {
  readonly appDialog = inject(AppDialogService);

  constructor() {
    addIcons({ alertCircleOutline, checkmarkCircleOutline, informationCircleOutline });
  }
}
