
import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth_service';

import {
  IonContent,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonSearchbar,
  IonModal,
  IonHeader,
  IonInput
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  cart,
  addCircleOutline, bookOutline, trash,
  cartOutline
} from 'ionicons/icons';

interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  coverClass: string;
  favorite: boolean;
  category: string;
}

@Component({
  selector: 'app-reader-home',
  templateUrl: './reader-home.page.html',
  styleUrls: ['./reader-home.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonContent, IonToolbar, IonTitle,
    IonButtons, IonButton, IonIcon,
    IonItem, IonLabel,
    IonCard, IonCardHeader, IonCardTitle,
    IonCardSubtitle, IonCardContent,
    IonSearchbar,
    IonModal, IonHeader, IonInput
  ]
})

export class ReaderHomePage {

  private authService = inject(AuthService);
  readonly username = this.authService.getUserData()?.user?.username
    || this.authService.getUserData()?.username
    || 'Reader';

  // Sample Book Data
  books = signal<Book[]>([
    {
      id: 1,
      title: 'His Unwritten Promise',
      author: 'Cy Caleb Reid',
      description: 'A profoundly moving and elegant reimagining of a much-loved classic.',
      coverClass: 'cover-orange',
      favorite: true,
      category: 'favorite'
    },
    {
      id: 2,
      title: 'Dear Future Ex',
      author: 'Sky Mel Kordy',
      description: 'Between the lines and their share a library of infinite second chances.',
      coverClass: 'cover-green',
      favorite: true,
      category: 'favorite'
    },
    {
      id: 3,
      title: 'How Great Books Go',
      author: 'Gabriella Smith',
      description: 'A new title available for your library.',
      coverClass: 'cover-orange',
      favorite: false,
      category: 'purchase'
    },
    {
      id: 4,
      title: 'The Midnight Library',
      author: 'Matt Haig',
      description: 'A story about the choices that shape a life.',
      coverClass: 'cover-blue',
      favorite: false,
      category: 'purchase'
    }
  ]);

  // Component Properties
  searchText = '';
  requestedTitle = '';
  requestedAuthor = '';

  // Signals
  category = signal('all');
  cartOpen = signal(false);
  requestOpen = signal(false);
  cartIds = signal<number[]>([]);

  // Computed Values
  filteredBooks = computed(() => {
    const search = this.searchText.toLowerCase();

    return this.books().filter(book =>
      book.title.toLowerCase().includes(search) ||
      book.author.toLowerCase().includes(search)
    );
  });

  displayedFavorites = computed(() =>
    this.filteredBooks().filter(book =>
      book.favorite
    )
  );

  displayedPurchase = computed(() =>
    this.filteredBooks().filter(book =>
      book.category === 'purchase'
    )
  );

  cartBooks = computed(() =>
    this.books().filter(book =>
      this.cartIds().includes(book.id)
    )
  );

  constructor() {
    addIcons({
      cart,
      addCircleOutline, bookOutline, trash,
      cartOutline
    });
  }

  searchBooks() {
    // filteredBooks updates automatically through the signal.
  }

  showCart() {
    this.cartOpen.set(true);
  }

  addToCart(id: number) {
    if (!this.cartIds().includes(id)) {
      this.cartIds.update(ids => [...ids, id]);
    }
  }

  removeFromCart(id: number) {
    this.cartIds.update(ids =>
      ids.filter(item => item !== id)
    );
  }

  borrowBook(id: number) {
    const book = this.books().find(item => item.id === id);

    if (book) {
      const requests = this.loadRequests();
      if (requests.some((request: any) => request.bookTitle === book.title && request.reader === this.username && request.status === 'Pending')) {
        alert('You already have a pending request for this book.');
        return;
      }
      requests.unshift({
        id: Date.now(),
        bookTitle: book.title,
        reader: this.username,
        status: 'Pending',
        requestedAt: new Date().toLocaleString()
      });
      localStorage.setItem('borrowRequests', JSON.stringify(requests));
      alert('Borrow request submitted for ' + book.title + '.');
    }
  }

  private loadRequests(): any[] {
    try {
      return JSON.parse(localStorage.getItem('borrowRequests') || '[]');
    } catch {
      return [];
    }
  }

  requestBook() {
    this.requestOpen.set(true);
  }

  submitRequest() {
    if (
      this.requestedTitle.trim() === '' ||
      this.requestedAuthor.trim() === ''
    ) {
      alert('Please enter the book title and author.');
      return;
    }

    const requests = this.loadRequests();
    requests.unshift({
      id: Date.now(),
      bookTitle: this.requestedTitle.trim(),
      reader: this.username,
      status: 'Pending',
      requestedAt: new Date().toLocaleString(),
      author: this.requestedAuthor.trim()
    });
    localStorage.setItem('borrowRequests', JSON.stringify(requests));
    alert('Your book request has been submitted!');

    this.requestedTitle = '';
    this.requestedAuthor = '';
    this.requestOpen.set(false);
  }

}
