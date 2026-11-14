import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, RouterLink],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
  menuOpen = false;
  cartOpen = false;
  cartItems = [
    { title: 'The Rain in España', selected: true },
    { title: 'Safe Skies, Archer', selected: false },
    { title: 'Golden Scenery of Tomorrow', selected: true },
  ];
  displayName = localStorage.getItem('lmsDisplayName') || 'Feona Lei Mas iclat';
  email = localStorage.getItem('lmsEmail') || 'feonaleimasiclat@gmail.com';

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }
  toggleCart(): void { this.cartOpen = !this.cartOpen; }
  closeCart(): void { this.cartOpen = false; }
  removeCartItem(title: string): void { this.cartItems = this.cartItems.filter((item) => item.title !== title); }
  checkout(): void { alert('Proceeding to checkout.'); }
}

