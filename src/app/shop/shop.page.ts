import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.page.html',
  styleUrls: ['./shop.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, RouterLink],
})
export class ShopPage {
  wishlistOpen = false;
  menuOpen = false;
  cartOpen = false;
  cartItems = [
    { title: 'The Rain in España', price: 520, selected: true },
    { title: 'Safe Skies, Archer', price: 520, selected: false },
    { title: 'Golden Scenery of Tomorrow', price: 520, selected: true },
  ];

  constructor(route: ActivatedRoute) {
    route.queryParamMap.subscribe((params) => {
      if (params.get('wishlist') === 'true') this.wishlistOpen = true;
    });
  }

  toggleMenu() { this.menuOpen = !this.menuOpen; }
  closeMenu() { this.menuOpen = false; }
  toggleCart() { this.cartOpen = !this.cartOpen; }
  closeCart() { this.cartOpen = false; }
  removeCartItem(title: string) { this.cartItems = this.cartItems.filter((item) => item.title !== title); }
  checkout() { alert('Proceeding to checkout.'); }

  toggleWishlist() {
    this.wishlistOpen = !this.wishlistOpen;
  }

  closeWishlist() {
    this.wishlistOpen = false;
  }
}
