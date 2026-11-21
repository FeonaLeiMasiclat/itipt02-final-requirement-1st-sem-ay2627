import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReaderHomePage } from './reader-home.page';

describe('ReaderHomePage', () => {
  let component: ReaderHomePage;
  let fixture: ComponentFixture<ReaderHomePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ReaderHomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
