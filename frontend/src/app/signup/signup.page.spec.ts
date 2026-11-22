import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignupPage } from './signup.page';

describe('SignupPage', () => {
  let component: SignupPage;
  let fixture: ComponentFixture<SignupPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(SignupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('submits the username and email together and shows a username conflict', () => {
    component.fullName = 'Library Reader';
    component.dateOfBirth = '2001-01-02';
    component.address = 'Library Street';
    component.email = 'reader@example.com';
    component.username = ' Reader_One ';
    component.password = 'demo-password';

    component.register();

    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne({ method: 'POST', url: '/api/register' });
    expect(request.request.body).toMatchObject({
      email: 'reader@example.com',
      username: 'Reader_One',
    });
    request.flush(
      { detail: 'That username is already registered.' },
      { status: 409, statusText: 'Conflict' },
    );
    expect(component.errorMessage()).toBe('That username is already registered.');
    http.verify();
  });
});
