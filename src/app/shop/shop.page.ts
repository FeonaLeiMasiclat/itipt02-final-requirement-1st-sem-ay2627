import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.page.html',
  styleUrls: ['./shop.page.scss'],
  standalone: true,
  imports: [IonContent, RouterLink],
})
export class ShopPage {
  wishlistOpen = false;

  toggleWishlist() {
    this.wishlistOpen = !this.wishlistOpen;
  }

  closeWishlist() {
    this.wishlistOpen = false;
  }
}
