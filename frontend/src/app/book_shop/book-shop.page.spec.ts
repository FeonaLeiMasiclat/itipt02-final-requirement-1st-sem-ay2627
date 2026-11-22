import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookShopPage } from './book-shop.page';

describe('BookShopPage', () => {
  let component: BookShopPage;
  let fixture: ComponentFixture<BookShopPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BookShopPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
