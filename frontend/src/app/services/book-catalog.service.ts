import { Injectable, signal } from '@angular/core';

export interface CatalogBook {
  id: number;
  title: string;
  author: string;
  copies: number;
  status: string;
  lastUpdated: string;
  genre: string;
  price: number;
  rating: number;
  reviews: number;
  synopsis: string;
}

const defaultBooks: CatalogBook[] = [
  { id: 2_000_001, title: 'His Unwritten Promise', author: 'Cy Caleb Reid', copies: 8, status: 'Active', lastUpdated: 'Nov 21, 2026', genre: 'Romance', price: 350, rating: 4.8, reviews: 120, synopsis: 'A profoundly moving and elegant reimagining of a much-loved classic.' },
  { id: 2_000_002, title: 'Dear Future Ex', author: 'Sky Mel Kordy', copies: 6, status: 'Active', lastUpdated: 'Nov 21, 2026', genre: 'Romance', price: 320, rating: 4.6, reviews: 87, synopsis: 'Between the lines and their share a library of infinite second chances.' },
  { id: 2_000_003, title: 'How Great Books Go', author: 'Gabriella Smith', copies: 5, status: 'Active', lastUpdated: 'Nov 21, 2026', genre: 'Comedy', price: 360, rating: 4.3, reviews: 54, synopsis: 'A new title available for your library.' },
  { id: 2_000_004, title: 'The Midnight Library', author: 'Matt Haig', copies: 7, status: 'Active', lastUpdated: 'Nov 21, 2026', genre: 'Sci-fi', price: 390, rating: 4.9, reviews: 143, synopsis: 'A story about the choices that shape a life.' },
  { id: 2_000_005, title: 'The House Beyond the Fog', author: 'Mara Ellery', copies: 4, status: 'Active', lastUpdated: 'Nov 21, 2026', genre: 'Horror', price: 340, rating: 4.5, reviews: 68, synopsis: 'A chilling story about the secrets waiting inside an abandoned house.' },
  { id: 2_000_006, title: 'The Last Olympian', author: 'R. J. Calloway', copies: 9, status: 'Active', lastUpdated: 'Nov 21, 2026', genre: 'Mythology', price: 410, rating: 4.7, reviews: 101, synopsis: 'A young hero faces ancient gods and a prophecy that could change everything.' },
  { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', copies: 10, status: 'Active', lastUpdated: 'Nov 21, 2026', genre: 'Romance', price: 350, rating: 4.8, reviews: 120, synopsis: 'A young dreamer enters the glittering world of the Jazz Age, where ambition, love, and the past collide.' },
  { id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee', copies: 10, status: 'Active', lastUpdated: 'Nov 21, 2026', genre: 'Romance', price: 420, rating: 4.9, reviews: 150, synopsis: 'In a small Southern town, a family and their neighbors confront prejudice, justice, and compassion.' },
  { id: 3, title: 'Pride and Prejudice', author: 'Jane Austen', copies: 10, status: 'Active', lastUpdated: 'Nov 21, 2026', genre: 'Romance', price: 300, rating: 4.7, reviews: 95, synopsis: 'Elizabeth Bennet and Mr. Darcy challenge first impressions as they discover affection and understanding.' },
  { id: 4, title: 'The Hobbit', author: 'J.R.R. Tolkien', copies: 10, status: 'Active', lastUpdated: 'Nov 21, 2026', genre: 'Mythology', price: 450, rating: 4.9, reviews: 180, synopsis: 'A reluctant hero leaves the Shire on a perilous journey through a world of legendary creatures.' },
  { id: 5, title: 'The Alchemist', author: 'Paulo Coelho', copies: 10, status: 'Active', lastUpdated: 'Nov 21, 2026', genre: 'Mythology', price: 380, rating: 4.6, reviews: 110, synopsis: 'A shepherd follows a recurring dream across the desert in search of a treasure and his purpose.' },
  { id: 6, title: 'Little Women', author: 'Louisa May Alcott', copies: 10, status: 'Active', lastUpdated: 'Nov 21, 2026', genre: 'Romance', price: 320, rating: 4.8, reviews: 88, synopsis: 'Four sisters grow up together, finding their own paths through family, friendship, and change.' },
  { id: 7, title: '1984', author: 'George Orwell', copies: 10, status: 'Active', lastUpdated: 'Nov 21, 2026', genre: 'Sci-fi', price: 390, rating: 4.7, reviews: 130, synopsis: 'In a tightly controlled future, Winston Smith begins to question the world built around him.' },
  { id: 8, title: 'The Catcher in the Rye', author: 'J.D. Salinger', copies: 10, status: 'Active', lastUpdated: 'Nov 21, 2026', genre: 'Comedy', price: 360, rating: 4.5, reviews: 76, synopsis: 'A sharp, funny account of a restless teenager navigating school, family, and growing up.' },
  { id: 3_000_001, title: 'The Rain in España', author: 'Gwy Saludes', copies: 12, status: 'Active', lastUpdated: 'Oct 25, 2026', genre: 'Romance', price: 350, rating: 0, reviews: 0, synopsis: 'A romantic story of friendship, personal growth, and young love.' }
];

@Injectable({ providedIn: 'root' })
export class BookCatalogService {
  readonly books = signal<CatalogBook[]>(this.loadBooks());

  save(): void {
    localStorage.setItem('adminBooks', JSON.stringify(this.books()));
    localStorage.setItem('bookCatalogInitialized', 'true');
  }

  private loadBooks(): CatalogBook[] {
    let saved: Partial<CatalogBook>[] = [];
    const initialized = localStorage.getItem('bookCatalogInitialized') === 'true';
    try {
      const stored = localStorage.getItem('adminBooks');
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) saved = parsed as Partial<CatalogBook>[];
    } catch {
      saved = [];
    }

    if (initialized) {
      return saved.filter(book => !!book.title).map(book => ({
        id: Number(book.id),
        title: String(book.title),
        author: String(book.author ?? ''),
        copies: Number(book.copies ?? 0),
        status: String(book.status ?? 'Active'),
        lastUpdated: String(book.lastUpdated ?? ''),
        genre: String(book.genre ?? 'Romance'),
        price: Number(book.price ?? 0),
        rating: Number(book.rating ?? 0),
        reviews: Number(book.reviews ?? 0),
        synopsis: String(book.synopsis ?? '')
      }));
    }

    const byTitle = new Map(defaultBooks.map(book => [this.key(book.title), { ...book }]));
    let nextId = 3_100_000;
    for (const oldBook of saved) {
      if (!oldBook.title) continue;
      const key = this.key(oldBook.title);
      const existing = byTitle.get(key);
      const candidateId = Number(oldBook.id);
      const idInUse = Number.isFinite(candidateId) && [...byTitle.values()].some(book => book.id === candidateId && this.key(book.title) !== key);
      const book: CatalogBook = {
        id: existing?.id ?? (Number.isFinite(candidateId) && !idInUse ? candidateId : nextId++),
        title: oldBook.title,
        author: oldBook.author ?? existing?.author ?? '',
        copies: Number(oldBook.copies ?? existing?.copies ?? 1),
        status: oldBook.status ?? existing?.status ?? 'Active',
        lastUpdated: oldBook.lastUpdated ?? existing?.lastUpdated ?? '',
        genre: oldBook.genre ?? existing?.genre ?? 'Romance',
        price: Number(oldBook.price ?? existing?.price ?? 0),
        rating: Number(oldBook.rating ?? existing?.rating ?? 0),
        reviews: Number(oldBook.reviews ?? existing?.reviews ?? 0),
        synopsis: oldBook.synopsis ?? existing?.synopsis ?? ''
      };
      byTitle.set(key, book);
    }
    const books = [...byTitle.values()];
    localStorage.setItem('adminBooks', JSON.stringify(books));
    localStorage.setItem('bookCatalogInitialized', 'true');
    return books;
  }

  private key(title: string): string {
    return title.trim().toLocaleLowerCase();
  }
}
